export function formatTimeToString(){
    
    const hour = new Date().getHours();

    switch(true){
        case hour >= 0 && hour <= 6: return "Доброй ночи"
        case hour >= 7 && hour <= 12: return "Доброе утро"
        case hour >= 13 && hour <= 18: return "Добрый день"
        case hour >= 19 && hour <= 24: return "Добрый вечер"
        default: return "Здравствуйте"
    }

}