import { Component, computed, effect, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { form, FormField, FormRoot, max, min, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Box } from './model/box.model';

type Config = {
  width:number,
  height:number ,
  nbMines:number,
}

@Component({
  imports: [RouterOutlet, ReactiveFormsModule, FormField, FormRoot, MatButtonModule, MatInputModule, MatFormFieldModule],
  selector: 'app-root',
  styleUrls: ['./app.scss'],
  templateUrl: './app.html',
  providers: [],
})
export class App {
  protected readonly title = signal('Démineur');
  protected readonly nbMines = signal(7);
  protected readonly width = signal(10);
  protected readonly height = signal(10);
  protected readonly boxes = signal<Box[][]>([]);

  public readonly mines = computed(() => this.boxes().flatMap(row => row.filter(box => box.mine)));
  public readonly allMinesFlagged = computed(() => {
    const mines = this.mines();
    if(mines.length === 0) return false;
    return mines.every(mine => mine.flagged);
  });
  public readonly notMineFlagged = computed(() => this.boxes().some(row => row.some(box => box.flagged && !box.mine)));

  model = signal<Config>({
    width: this.width(),
    height: this.height(),
    nbMines: this.nbMines()
  });
  configForm = form(this.model, (schemaPath) => {
      required(schemaPath.width, {message: 'width is required'});
      max(schemaPath.width, 50, {message: 'maximum value is 50'});
      min(schemaPath.width, 5, {message: 'minimum value is 5'});
      required(schemaPath.height, {message: 'height is required'});
      max(schemaPath.height, 50, {message: 'maximum value is 50'});
      min(schemaPath.height, 5, {message: 'minimum value is 5'});
      required(schemaPath.nbMines, {message: 'number of mines is required'});
      min(schemaPath.nbMines, 1, {message: 'minimum value is 1'});
      validate(schemaPath.nbMines, ({value}) => {
      if (value() > this.width() * this.height() - 1) {
        return {
          kind: 'nbMines',
          message: 'Number of mines must be less than the total number of boxes',
        };
      }
      return null;
    });
  });

  constructor() {
    effect(() => {
        if(this.boxes().length > 0 && this.allMinesFlagged() && !this.notMineFlagged()) {
        this.showAllBoxes(true);
        setTimeout(() => {
          alert('You Win!');
          this.initGame();
        }, 300);
      }
    });
  }

  private showAllBoxes(notMine = false): void{
    for (const row of this.boxes()) {
      for (const box of row) {
        if(notMine && box.mine) continue;
        box.hidden = false;
      }
    }
  }

  public onSubmit(): void {
    const config = this.configForm().value();
    this.width.set(config.width);
    this.height.set(config.height);
    this.nbMines.set(config.nbMines);

    this.initGame();
  }

  private initGame(): void {
    const initBoxes: Box[][] = Array.from({ length: this.height() }, () =>
      Array.from({ length: this.width() }, () => new Box())
    );
  
    this.boxes.set(initBoxes);
  }

  private initMines( xClic: number, yClic: number): void {
    if (typeof Worker !== 'undefined') {
        // Create a new
        const worker = new Worker(new URL('./add-mines.worker', import.meta.url));
        worker.onmessage = ({data}) => {
            this.boxes.set([...data]);
        };
        worker.postMessage({
          nbMines: this.nbMines(),
          xClic: xClic,
          yClic: yClic,
          width: this.width(),
          height: this.height(),
          boxes: this.boxes(),
        });
      } else {
        console.error('Web workers are not supported in this environment.');
        // Web workers are not supported in this environment.
        // You should add a fallback so that your program still executes correctly.
      }
   
  }

  public rightClic(event: MouseEvent, x: number, y: number): void {
    event.preventDefault(); 
    
    this.boxes.update((boxes) => { // use update to recompute the state after right click
      const box = boxes[y][x];
      box.flagged = !box.flagged;
      return [...boxes];
    });
  }

  public leftClic( x: number, y: number): void {
    const b = this.boxes()[y][x];
    if(!b.hidden || b.flagged) {
      return;
    }

    this.boxes.update((boxes) => { // use update to recompute the state after right click
      const box = boxes[y][x];
      box.hidden = false;
      return [...boxes];
    });

    if(this.mines().length === 0) {
      this.initMines(x, y);
    }

    if(b.mine) {
      this.showAllBoxes();
      setTimeout(() => {
        alert('Game Over');
        this.initGame();  
      }, 300);
    } else if(b.adjacentMines == 0){
      this.revealAdjacentBoxes(x, y);
    }
  }

  private revealAdjacentBoxes(x: number, y: number): void {
    const boxes = this.boxes();
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newX = x + j;
        const newY = y + i;
        if (newX >= 0 && newX < this.width() && newY >= 0 && newY < this.height()) {
          const box = boxes[newY][newX];
          if (box.hidden && !box.flagged && !box.mine) {
            box.hidden = false;
            if (box.adjacentMines === 0) {
              this.revealAdjacentBoxes(newX, newY);
            }
          }
        }
      }
    }
  }
}
