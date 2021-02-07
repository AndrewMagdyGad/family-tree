import { Controller, Get, Post, Body } from '@nestjs/common';
import { NodeService } from './service';

@Controller()
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  @Get()
  getHello(): string {
    return this.nodeService.getHello();
  }

  @Post('createFamilyTree')
  createFamilyTree(
    @Body()
    tree: {
      name: string;
      money: number;
      isMale: boolean;
      relations: [{ relation: string; name: string; money: number }];
    },
  ) {
    return this.nodeService.createFamilyTree(tree);
  }

  @Post('computeLegacy')
  computeLegacy(
    @Body()
    payload: {
      _id: string;
    },
  ) {
    return this.nodeService.computeLegacy(payload._id);
  }
}
