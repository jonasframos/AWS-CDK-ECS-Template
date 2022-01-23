#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkEcsTemplateStack } from '../lib/aws-cdk-ecs-template-stack';

const app = new cdk.App();
new AwsCdkEcsTemplateStack(app, 'AwsCdkEcsTemplateStack', {});