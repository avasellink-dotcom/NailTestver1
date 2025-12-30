import json
import os

def check_signals():
    path = r'c:\Users\Neirostation\.gemini\antigravity\playground\void-hubble\src\data\courseDays.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    missing = []
    for day in data:
        day_num = day.get('dayNumber')
        signals = day.get('signals', [])
        for i, signal in enumerate(signals):
            reaction = signal.get('reaction', '')
            if not reaction:
                missing.append(f"Day {day_num} Signal {i+1} ({signal.get('id')}): EMPTY REACTION")
                continue
            
            # Check for the required format markers
            if '✅' not in reaction or ('❌' not in reaction and 'trap' not in signal):
                # If trap exists but reaction is old format, it might still need rewrite
                if '✅' not in reaction:
                    missing.append(f"Day {day_num} Signal {i+1} ({signal.get('id')}): OLD FORMAT (missing ✅)")
    
    if missing:
        print("\n".join(missing))
    else:
        print("All signals are in the new format!")

if __name__ == "__main__":
    check_signals()
