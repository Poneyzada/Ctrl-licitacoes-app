import csv
import json

with open('scratch_planilha_ufc.csv', mode='r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f)
    rows = list(reader)

header = rows[0]
print("Header:", header)
valid_rows = []

for idx, r in enumerate(rows[1:], start=2):
    if len(r) >= 9 and (r[0].strip() or r[2].strip() or r[8].strip()):
        prof = r[0].strip()
        funcao = r[1].strip() if len(r) > 1 else ''
        titulo = r[2].strip() if len(r) > 2 else ''
        valor_obra = r[3].strip() if len(r) > 3 else ''
        valor_trab = r[4].strip() if len(r) > 4 else ''
        tipo_servico = r[6].strip() if len(r) > 6 else ''
        servicos_quant = r[7].strip() if len(r) > 7 else ''
        numero_cat = r[8].strip() if len(r) > 8 else ''
        link = r[9].strip() if len(r) > 9 else ''
        
        valid_rows.append({
            'linha': idx,
            'profissional': prof,
            'funcao': funcao,
            'titulo': titulo,
            'valor_obra': valor_obra,
            'valor_trabalhado': valor_trab,
            'tipo_servico': tipo_servico,
            'servicos_quantificados': servicos_quant,
            'numero_cat': numero_cat,
            'link_documento': link
        })

print(f"Total registros válidos encontrados: {len(valid_rows)}")
print("Primeiros 3 registros:")
print(json.dumps(valid_rows[:3], indent=2, ensure_ascii=False))
