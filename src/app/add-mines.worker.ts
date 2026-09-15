/// <reference lib="webworker" />

import { Box } from "./model/box.model";

type AddMinesInput = {
  nbMines:number,
  xClic: number, 
  yClic: number,
  width: number,
  height: number,
  boxes : Box[][];
}

addEventListener('message', ({ data }: { data: AddMinesInput }) => {
  for (let i = 0; i < data.nbMines; i++) {
        const x = Math.floor(Math.random() * data.width);
        const y = Math.floor(Math.random() * data.height);
        if(x === data.xClic && y === data.yClic) {
          i--;
          continue;
        }
       // console.log('Mine', x, y);
        data.boxes[y][x].mine = true;
        data.boxes[y][x].adjacentMines = 0;

        if(x+1 < data.width && !data.boxes[y][x+1].mine) {
          data.boxes[y][x+1].adjacentMines++;
        }
        if(x-1 >= 0 && !data.boxes[y][x-1].mine) {
          data.boxes[y][x-1].adjacentMines++;
        }

        if(y+1 < data.height ) {
          if( !data.boxes[y+1][x].mine) {
            data.boxes[y+1][x].adjacentMines++;
          }
          if( x+1 < data.width && !data.boxes[y+1][x+1].mine) {
            data.boxes[y+1][x+1].adjacentMines++;
          }
          if( x-1 >= 0 && !data.boxes[y+1][x-1].mine) {
           data.boxes[y+1][x-1].adjacentMines++;
          }
        }

        if(y-1 >= 0) {
          if(!data.boxes[y-1][x].mine) {
            data.boxes[y-1][x].adjacentMines++;
          }
          if( x+1 < data.width && !data.boxes[y-1][x+1].mine) {
            data.boxes[y-1][x+1].adjacentMines++;
          }
           if( x-1 >= 0 && !data.boxes[y-1][x-1].mine) {
            data.boxes[y-1][x-1].adjacentMines++;
          }
        } 
      }
  postMessage(data.boxes);
});
