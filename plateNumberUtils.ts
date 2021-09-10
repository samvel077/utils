export function unifyRegistrationNumber(number: string): string {
    if (!number) return number;

    let unified = '';

    for (let i = 0; i < number.length; i++) {
        const c = mapChar(number[i]);
        if (c) unified += c;
    }

    return unified;
}

function mapChar(srcChar: string): string {
    const srcUpperCase = srcChar.toUpperCase();

    if (srcChar >= '0' && srcChar <= '9') return srcChar;
    if (srcChar >= 'A' && srcChar <= 'Z') return srcChar;
    if (srcChar >= 'a' && srcChar <= 'z') return srcUpperCase;

    switch (srcUpperCase) {
        case 'А': return 'A';
        case 'В': return 'B';
        case 'Е': return 'E';
        case 'К': return 'K';
        case 'М': return 'M';
        case 'Н': return 'H';
        case 'О': return 'O';
        case 'Р': return 'P';
        case 'С': return 'C';
        case 'Т': return 'T';
        case 'У': return 'Y';
        case 'Х': return 'X';
    
        default:
            return srcChar;
    }
}