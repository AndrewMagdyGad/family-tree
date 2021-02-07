import { Document } from 'mongoose';

interface Relation {
  _id: string;
  //   name: string;
  //   money: number;
  relation: string;
}

export interface NodeDocument extends Document {
  _id: string;
  name: string;
  money: number;
  relations: [Relation];
}
