export function setupBoard() {
    let table = document.querySelector("table");
    for (let i = 0; i <= 10; i++) {
        let row = document.createElement("tr");
        row.id = `r${i}`;
        table.appendChild(row);

        if (i === 0) {
            for (let j = 0; j < 5; j++) {
                let cell = document.createElement("td");
                cell.className = "cell randCell";
                cell.textContent = "?";
                row.appendChild(cell);
            }
        } else {
            for (let j = 1; j <= 5; j++) {
                let cell = document.createElement("td");
                cell.className = (i + j) % 2 === 1 ? "cell ordinaryCellDark" : "cell ordinaryCellLight";
                cell.innerHTML = `<input type="text" maxlength="1" />`;
                row.appendChild(cell);
            }
            let resultCell = document.createElement("td");
            resultCell.className = "cell resultCell";
            row.appendChild(resultCell);
        }
    }
}

export function focusNextCell(row) {
    let inputs = document.querySelectorAll(`#r${row} input`);
    for (let input of inputs) {
        if (!input.value) {
            input.focus();
            break;
        }
    }
}

export function updateResult(row, exact, correct) {
    document.querySelector(`#r${row} .resultCell`).textContent = `${correct} | ${exact}`;
}

export function resetBoard(secret, win) {
    document.querySelector("table").innerHTML = "";
    alert(win ? "Congratulations! You've won!" : "Game over, try again.");
    setupBoard();
}
