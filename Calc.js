export function calculateResults(secret, guess) {
    let exactMatches = 0;
    let correctDigits = 0;
    let matchedPositions = Array(5).fill(false);

    guess.forEach((digit, i) => {
        if (digit === secret[i]) {
            exactMatches++;
            matchedPositions[i] = true;
        } else if (secret.includes(digit) && !matchedPositions[secret.indexOf(digit)]) {
            correctDigits++;
            matchedPositions[secret.indexOf(digit)] = true;
        }
    });

    return { exactMatches, correctDigits };
}
