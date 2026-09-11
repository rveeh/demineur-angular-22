export class Box {
    hidden : boolean = true;
    flagged: boolean = false;
    mine: boolean;
    adjacentMines: number = 0;

    constructor(mine?: boolean) {
        this.mine = mine ?? false;
    }
}