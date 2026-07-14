"""
Self-contained PDF form filler.
Dependencies: pypdf only (pip install pypdf)
backend/scripts/fill_fillable_fields.py is a self-contained script that fills in form fields in a PDF file based on values provided in a JSON file. It uses the pypdf library to read and write PDF files.
Usage: python fill_fillable_fields.py input.pdf field_values.json output.pdf
"""
import json
import sys
from pypdf import PdfReader, PdfWriter


# ── Inlined from extract_form_field_info.py ───────────────────────────────────

def get_full_annotation_field_id(annotation):
    components = []
    while annotation:
        field_name = annotation.get('/T')
        if field_name:
            components.append(field_name)
        annotation = annotation.get('/Parent')
    return ".".join(reversed(components)) if components else None


def make_field_dict(field, field_id):
    field_dict = {"field_id": field_id}
    ft = field.get('/FT')
    if ft == "/Tx":
        field_dict["type"] = "text"
    elif ft == "/Btn":
        field_dict["type"] = "checkbox"
        states = field.get("/_States_", [])
        if len(states) == 2:
            if "/Off" in states:
                field_dict["checked_value"] = states[0] if states[0] != "/Off" else states[1]
                field_dict["unchecked_value"] = "/Off"
            else:
                field_dict["checked_value"] = states[0]
                field_dict["unchecked_value"] = states[1]
    elif ft == "/Ch":
        field_dict["type"] = "choice"
        states = field.get("/_States_", [])
        field_dict["choice_options"] = [{"value": state[0], "text": state[1]} for state in states]
    else:
        field_dict["type"] = f"unknown ({ft})"
    return field_dict


def get_field_info(reader: PdfReader):
    fields = reader.get_fields()
    field_info_by_id = {}
    possible_radio_names = set()

    for field_id, field in fields.items():
        if field.get("/Kids"):
            if field.get("/FT") == "/Btn":
                possible_radio_names.add(field_id)
            continue
        field_info_by_id[field_id] = make_field_dict(field, field_id)

    radio_fields_by_id = {}

    for page_index, page in enumerate(reader.pages):
        annotations = page.get('/Annots', [])
        for ann in annotations:
            field_id = get_full_annotation_field_id(ann)
            if field_id in field_info_by_id:
                field_info_by_id[field_id]["page"] = page_index + 1
                field_info_by_id[field_id]["rect"] = ann.get('/Rect')
            elif field_id in possible_radio_names:
                try:
                    on_values = [v for v in ann["/AP"]["/N"] if v != "/Off"]
                except KeyError:
                    continue
                if len(on_values) == 1:
                    rect = ann.get("/Rect")
                    if field_id not in radio_fields_by_id:
                        radio_fields_by_id[field_id] = {
                            "field_id": field_id,
                            "type": "radio_group",
                            "page": page_index + 1,
                            "radio_options": [],
                        }
                    radio_fields_by_id[field_id]["radio_options"].append({
                        "value": on_values[0],
                        "rect": rect,
                    })

    fields_with_location = []
    for field_info in field_info_by_id.values():
        if "page" in field_info:
            fields_with_location.append(field_info)

    def sort_key(f):
        if "radio_options" in f:
            rect = f["radio_options"][0]["rect"] or [0, 0, 0, 0]
        else:
            rect = f.get("rect") or [0, 0, 0, 0]
        return [f.get("page"), [-rect[1], rect[0]]]

    sorted_fields = fields_with_location + list(radio_fields_by_id.values())
    sorted_fields.sort(key=sort_key)
    return sorted_fields


# ── Fill logic ────────────────────────────────────────────────────────────────

def validation_error_for_field_value(field_info, field_value):
    field_type = field_info["type"]
    field_id = field_info["field_id"]
    if field_type == "checkbox":
        checked_val = field_info.get("checked_value", "")
        unchecked_val = field_info.get("unchecked_value", "/Off")
        if field_value != checked_val and field_value != unchecked_val:
            return f'ERROR: Invalid value "{field_value}" for checkbox "{field_id}". checked="{checked_val}" unchecked="{unchecked_val}"'
    elif field_type == "radio_group":
        option_values = [opt["value"] for opt in field_info.get("radio_options", [])]
        if field_value not in option_values:
            return f'ERROR: Invalid value "{field_value}" for radio group "{field_id}". Valid: {option_values}'
    elif field_type == "choice":
        choice_values = [opt["value"] for opt in field_info.get("choice_options", [])]
        if field_value not in choice_values:
            return f'ERROR: Invalid value "{field_value}" for choice "{field_id}". Valid: {choice_values}'
    return None


def fill_pdf_fields(input_pdf_path: str, fields_json_path: str, output_pdf_path: str):
    with open(fields_json_path, encoding='utf-8') as f:
        fields = json.load(f)

    reader = PdfReader(input_pdf_path)
    field_info = get_field_info(reader)
    fields_by_ids = {f["field_id"]: f for f in field_info}

    fields_by_page = {}

    for field in fields:
        field_id = field["field_id"]
        page = field.get("page", 1)
        value = field.get("value", "")

        existing_field = fields_by_ids.get(field_id)
        if not existing_field:
            # Skip unknown fields silently
            print(f"WARNING: field not found in PDF, skipping: {field_id}", file=sys.stderr)
            continue

        if "value" in field:
            err = validation_error_for_field_value(existing_field, value)
            if err:
                # Skip invalid values, don't abort
                print(err, file=sys.stderr)
                continue

        if page not in fields_by_page:
            fields_by_page[page] = {}
        fields_by_page[page][field_id] = value

    writer = PdfWriter(clone_from=reader)
    for page, field_values in fields_by_page.items():
        writer.update_page_form_field_values(
            writer.pages[page - 1], field_values, auto_regenerate=False
        )

    writer.set_need_appearances_writer(True)

    with open(output_pdf_path, "wb") as f:
        writer.write(f)


def monkeypatch_pypdf_method():
    from pypdf.generic import DictionaryObject
    from pypdf.constants import FieldDictionaryAttributes

    original_get_inherited = DictionaryObject.get_inherited

    def patched_get_inherited(self, key: str, default=None):
        result = original_get_inherited(self, key, default)
        if key == FieldDictionaryAttributes.Opt:
            if isinstance(result, list) and all(
                isinstance(v, list) and len(v) == 2 for v in result
            ):
                result = [r[0] for r in result]
        return result

    DictionaryObject.get_inherited = patched_get_inherited


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python fill_fillable_fields.py input.pdf field_values.json output.pdf")
        sys.exit(1)

    monkeypatch_pypdf_method()

    input_pdf = sys.argv[1]
    fields_json = sys.argv[2]
    output_pdf = sys.argv[3]

    fill_pdf_fields(input_pdf, fields_json, output_pdf)
    print(f"Done: {output_pdf}")