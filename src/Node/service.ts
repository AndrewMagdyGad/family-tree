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

  async computeLegacy(id: string) {
    const map: Map<string, string[]> = new Map<string, Array<string>>();
    const coreNode = await this.nodeModel.findById(id);
    for (const item of coreNode.relations) {
      if (map.has(item.relation)) {
        map.get(item.relation).push(item._id);
      } else {
        map.set(item.relation, [item._id]);
      }
    }

    // calculate
    // {percentage: number, relation:string, name:[string]}
    let total = 100;
    const result = new Array<{
      percentage: number;
      relation: string;
      name: string[];
    }>();

    let temp = 0;

    // case husband
    if (map.has('husband')) {
      const husband = await this.nodeModel.findById(map.get('husband')[0]);
      let percentage = 0;
      if (map.has('son') || map.has('daughter')) {
        percentage = Number(((total * 1) / 4).toFixed(2));
      } else {
        percentage = Number(((total * 1) / 2).toFixed(2));
      }
      result.push({
        percentage,
        relation: 'husband',
        name: [husband.name],
      });

      temp += percentage;
      // total -= percentage;
    }

    // case wife
    if (map.has('wife')) {
      let percentage = 0;
      if (map.has('son') || map.has('daughter')) {
        percentage = Number(((total * 1) / 8).toFixed(2));
      } else {
        percentage = Number(((total * 1) / 4).toFixed(2));
      }

      const ids = map.get('wife');
      const wifes = new Array<string>();

      for (const id of ids) {
        const data = await this.nodeModel.findById(id);
        wifes.push(data.name);
      }

      result.push({
        percentage,
        relation: 'wife',
        name: wifes,
      });

      temp += percentage;
      // total -= percentage;
    }

    // case mother
    if (map.has('mother')) {
      const mother = await this.nodeModel.findById(map.get('mother')[0]);
      let percentage = 0;
      if (map.has('son') || map.has('daughter')) {
        percentage = Number(((total * 1) / 6).toFixed(2));
      } else {
        percentage = Number(((total * 1) / 3).toFixed(2));
      }

      result.push({
        percentage,
        relation: 'mother',
        name: [mother.name],
      });

      temp += percentage;
      // total -= percentage;
    }

    // case father
    if (map.has('father')) {
      const father = await this.nodeModel.findById(map.get('father')[0]);
      let percentage = 0;
      if (map.has('son') || map.has('daughter')) {
        percentage = Number(((total * 1) / 6).toFixed(2));
        temp += percentage;
      } else {
        total -= temp;
        percentage = Number((total * 1).toFixed(2));
      }

      result.push({
        percentage,
        relation: 'father',
        name: [father.name],
      });

      // total -= percentage;
    }

    // case daughter
    if (map.has('daughter')) {
      let percentage = 0;
      if (!map.has('son')) {
        const daughterNumber = map.get('daughter').length;
        if (daughterNumber == 1) {
          percentage = Number(((total * 1) / 2).toFixed(2));
        } else {
          percentage = Number(((total * 2) / 3).toFixed(2));
        }

        const ids = map.get('daughter');
        const daughters = new Array<string>();

        for (const id of ids) {
          const data = await this.nodeModel.findById(id);
          daughters.push(data.name);
        }

        result.push({
          percentage, // 18.2
          relation: 'daughter',
          name: daughters,
        });

        total -= percentage;

        temp += percentage;
      }
    }

    // case son
    if (map.has('son')) {
      const children =
        map.get('son').length * 2 +
        (map.has('daughter') ? map.get('daughter').length : 0);

      // if (map.has('daughter')) {
      total -= temp;
      // }

      const sonIds = map.get('son');
      const sons = new Array<string>();

      for (const id of sonIds) {
        const data = await this.nodeModel.findById(id);
        sons.push(data.name);
      }

      result.push({
        percentage: Number((((total * 1) / children) * 2).toFixed(2)), // 18.2
        relation: 'son',
        name: sons,
      });

      if (map.has('daughter')) {
        const daughterIds = map.get('daughter');
        const daughters = new Array<string>();

        for (const id of daughterIds) {
          const data = await this.nodeModel.findById(id);
          daughters.push(data.name);
        }

        result.push({
          percentage: Number(((total * 1) / children).toFixed(2)),
          relation: 'daughter',
          name: daughters,
        });
      }
    }

    return { result, money: coreNode.money, name: coreNode.name };
  }
}
