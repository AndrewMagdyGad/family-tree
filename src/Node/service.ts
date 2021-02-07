import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NodeDocument } from './interface';

@Injectable()
export class NodeService {
  constructor(
    @InjectModel('Node')
    private readonly nodeModel: Model<NodeDocument>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createFamilyTree(tree: {
    name: string;
    money: number;
    isMale: boolean;
    relations: [{ relation: string; name: string; money: number }];
  }) {
    // create node for the core node and its relevent nodes
    const coreNode = await this.createNode({
      name: tree.name,
      money: tree.money,
    });

    for (const item of tree.relations) {
      let complementRelation: string = '';

      switch (item.relation) {
        case 'son':
        case 'daughter':
          complementRelation = tree.isMale ? 'father' : 'mother';
          break;
        case 'husband':
          complementRelation = 'wife';
          break;
        case 'wife':
          complementRelation = 'husband';
          break;
        case 'father':
        case 'mother':
          complementRelation = tree.isMale ? 'son' : 'daughter';
          break;
        case 'brother':
        case 'sister':
          complementRelation = tree.isMale ? 'brother' : 'sister';
          break;
      }

      const data = new this.nodeModel({
        name: item.name,
        money: item.money,
        relations: [{ _id: coreNode.id, relation: complementRelation }],
      });
      const node = await data.save();

      coreNode.relations.push({ _id: node.id, relation: item.relation });
      const toBeUpdated = [...coreNode.relations];

      await this.nodeModel.updateOne(
        { _id: coreNode.id },
        { relations: toBeUpdated },
      );

      node.relations.push({ _id: coreNode.id, relation: complementRelation });
      await this.nodeModel.updateOne(
        { _id: node.id },
        { relation: [...node.relations] },
      );
    }

    return coreNode;
  }

  async createNode(node: { name: string; money: number }) {
    const data = new this.nodeModel({ name: node.name, money: node.money });
    const res = await data.save();
    return res;
  }
}
