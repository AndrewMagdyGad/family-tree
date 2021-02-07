import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NodeController } from './controller';
import { NodeService } from './service';
import { NodeSchema } from './schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Node',
        schema: NodeSchema,
        collection: 'node',
      },
    ]),
  ],
  controllers: [NodeController],
  providers: [NodeService],
})
export class NodeModule {}
