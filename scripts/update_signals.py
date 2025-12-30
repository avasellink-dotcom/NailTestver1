import json
import re

with open('src/data/courseDays.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for day in data:
    if day['dayNumber'] <= 7:
        continue # Skip already processed days
        
    if 'signals' not in day:
        continue
        
    for signal in day['signals']:
        title = signal.get('title', '')
        triggers = signal.get('triggers', [])
        reaction = signal.get('reaction', '')
        trap = signal.get('trap', '')
        
        # Clean up triggers (remove -- and empty)
        clean_triggers = [t for t in triggers if t and t != '--']
        main_trigger = clean_triggers[0] if clean_triggers else title
        
        # Simple heuristic for reaction if empty
        if not reaction:
            if "소독" in title or "멸균" in title:
                signal['reaction'] = f"Когда видишь \"{main_trigger}\" в вопросе:\n\n✅ ПРАВИЛЬНО: Выбирай стандартный метод обработки (100°C / 20 мин).\n\n💡 Запомни: Цифры в санитарии — это ключ к ответу."
            elif "네일" in title or "손톱" in title:
                signal['reaction'] = f"Когда видишь \"{main_trigger}\" в вопросе:\n\n✅ ПРАВИЛЬНО: Связано с защитой, укреплением или красотой ногтей.\n\n💡 Запомни: Правильный инструмент для каждой задачи!"
            else:
                signal['reaction'] = f"Когда видишь \"{main_trigger}\" в вопросе:\n\n✅ ПРАВИЛЬНО: Ищи самое точное определение.\n\n💡 Запомни: Сигнал слово — это твой ориентир."

        # Ensure pattern if reaction exists but doesn't follow template
        # (This is a simplified version, ideally we'd preserve existing logic if any)
        
with open('src/data/courseDays.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
