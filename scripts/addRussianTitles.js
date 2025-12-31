// Add Russian translations to courseDays.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translations = {
    1: "Основы общественного здоровья",
    2: "Население и показатели",
    3: "Основы заболеваний",
    4: "ПОВТОРЕНИЕ: Дни 1-3",
    5: "Дезинфекция и стерилизация",
    6: "Кожные инфекции",
    7: "Санитария на рабочем месте",
    8: "ПОВТОРЕНИЕ: Дни 5-7",
    9: "Анатомия ногтей",
    10: "Заболевания ногтей",
    11: "Структура кожи",
    12: "Типы кожи",
    13: "Кожные заболевания",
    14: "ПОВТОРЕНИЕ: Дни 9-13",
    15: "Косметические ингредиенты",
    16: "Химия продуктов",
    17: "Безопасность продуктов",
    18: "Техника маникюра",
    19: "Техника педикюра",
    20: "Гель-лаки и покрытия",
    21: "ПОВТОРЕНИЕ: Дни 15-20",
    22: "Наращивание ногтей",
    23: "Нейл-арт",
    24: "Безопасность клиента",
    25: "Законодательство",
    26: "Управление салоном",
    27: "Экзаменационная практика",
    28: "ФИНАЛЬНЫЙ ТЕСТ"
};

const filePath = path.join(__dirname, '../src/data/courseDays.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

data.forEach(day => {
    if (translations[day.dayNumber]) {
        day.titleRu = translations[day.dayNumber];
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ Russian translations added to courseDays.json');
