import json
import os

def split_questions(input_file, output_dir, max_lines=400):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Criar cards de revisão (Pergunta e Resposta) baseados nos campos existentes
    for q in data:
        q['card'] = {
            'pergunta': q['enunciado'],
            'resposta': f"Resposta: {q['resposta']}\nComentário: {q.get('comentario', 'Sem comentário.')}"
        }

    # Dividir em blocos
    chunk_size = 30  # Ajustado para manter aproximadamente 300-400 linhas reais de JSON (cada questão tem ~10-15 linhas)
    
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i + chunk_size]
        file_index = i // chunk_size + 1
        output_path = os.path.join(output_dir, f'questions_part_{file_index}.json')
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(chunk, f, indent=2, ensure_ascii=False)
        print(f"Criado: {output_path}")

if __name__ == '__main__':
    split_questions('scripts/data/questions.json', 'scripts/data/processed_questions')
