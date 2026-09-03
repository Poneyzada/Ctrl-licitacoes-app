import zipfile
import xml.etree.ElementTree as ET
import json
import re

NS = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def extract_workbook(filename):
    with zipfile.ZipFile(filename) as z:
        # Load shared strings
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            s_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in s_tree.findall('ns:si', NS):
                text_elems = si.findall('.//ns:t', NS)
                strings.append("".join([t.text or "" for t in text_elems]))

        # Load sheets list
        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = []
        for s in wb_tree.findall('.//ns:sheet', NS):
            sheets.append({
                'name': s.attrib.get('name'),
                'sheetId': s.attrib.get('sheetId')
            })

        all_records = []

        for idx, s in enumerate(sheets, start=1):
            sheet_file = f'xl/worksheets/sheet{idx}.xml'
            if sheet_file not in z.namelist():
                continue

            sh_tree = ET.fromstring(z.read(sheet_file))
            rows_data = []

            for row in sh_tree.findall('.//ns:row', NS):
                row_cells = {}
                for c in row.findall('ns:c', NS):
                    r_ref = c.attrib.get('r', '')
                    col_letter = "".join([ch for ch in r_ref if ch.isalpha()])
                    val_type = c.attrib.get('t')
                    v_elem = c.find('ns:v', NS)
                    val = ""
                    if v_elem is not None and v_elem.text is not None:
                        raw_v = v_elem.text
                        if val_type == 's':
                            try:
                                val = strings[int(raw_v)]
                            except:
                                val = raw_v
                        else:
                            val = raw_v
                    row_cells[col_letter] = val
                if row_cells:
                    rows_data.append(row_cells)

            print(f"Sheet '{s['name']}': {len(rows_data)} rows")

            if rows_data:
                for r in rows_data[1:]:
                    # Let's inspect column values
                    prof = r.get('A', '').strip()
                    funcao = r.get('B', '').strip()
                    titulo = r.get('C', '').strip()
                    valor_obra = r.get('D', '').strip()
                    valor_trab = r.get('E', '').strip()
                    tipo_serv = r.get('G', '').strip()
                    serv_quant = r.get('H', '').strip()
                    num_atestado = r.get('I', '').strip()
                    link = r.get('J', '').strip()

                    # Fallbacks if columns are shifted or different
                    if not num_atestado:
                        for k, v in r.items():
                            if re.search(r'\d{4,8}/\d{4}', v) or re.search(r'BA\d{6,}', v) or re.search(r'CE\d{6,}', v) or re.search(r'ABC-\d+', v):
                                num_atestado = v.strip()
                            if 'drive.google.com' in v or 'http' in v:
                                link = v.strip()

                    if not link:
                        for k, v in r.items():
                            if 'drive.google.com' in v or 'http' in v:
                                link = v.strip()

                    if titulo or num_atestado or link or serv_quant or prof:
                        all_records.append({
                            'sheet': s['name'],
                            'profissional': prof,
                            'funcao': funcao,
                            'objeto': titulo or serv_quant or prof,
                            'titulo': titulo,
                            'valor_obra': valor_obra,
                            'valor_trabalhado': valor_trab,
                            'tipo_servico': tipo_serv or s['name'],
                            'servicos_quantificados': serv_quant,
                            'numero_cat': num_atestado,
                            'numero_atestado': num_atestado,
                            'link_documento': link,
                            'raw': r
                        })

        print(f"\nTotal de registros extraídos de todas as abas da Pórtico: {len(all_records)}")
        with open('scratch_portico_acervos.json', 'w', encoding='utf-8') as out:
            json.dump(all_records, out, indent=2, ensure_ascii=False)

extract_workbook('scratch_planilha_portico.xlsx')
