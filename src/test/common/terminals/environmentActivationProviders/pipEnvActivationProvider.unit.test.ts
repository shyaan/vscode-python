// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import * as assert from 'assert';
import { instance, mock, when } from 'ts-mockito';
import * as TypeMoq from 'typemoq';
import { Uri } from 'vscode';
import { PipEnvActivationCommandProvider } from '../../../../client/common/terminal/environmentActivationProviders/pipEnvActivationProvider';
import { ITerminalActivationCommandProvider, TerminalShellType } from '../../../../client/common/terminal/types';
import { getNamesAndValues } from '../../../../client/common/utils/enum';
import { IInterpreterService, InterpreterType, IPipEnvService } from '../../../../client/interpreter/contracts';
import { InterpreterService } from '../../../../client/interpreter/interpreterService';

// tslint:disable:no-any

suite('Terminals Activation - Pipenv', () => {
    [undefined, Uri.parse('x')].forEach(resource => {
        suite(resource ? 'With a resource' : 'Without a resource', () => {
            let activationProvider: ITerminalActivationCommandProvider;
            let interpreterService: IInterpreterService;
            let pipenvService: TypeMoq.IMock<IPipEnvService>;
            setup(() => {
                interpreterService = mock(InterpreterService);
                pipenvService = TypeMoq.Mock.ofType<IPipEnvService>();
                activationProvider = new PipEnvActivationCommandProvider(
                    instance(interpreterService),
                    pipenvService.object
                );

                pipenvService.setup(p => p.executable).returns(() => 'pipenv');
            });

            test('No commands for no interpreter', async () => {
                when(interpreterService.getActiveInterpreter(resource)).thenResolve();

                for (const shell of getNamesAndValues<TerminalShellType>(TerminalShellType)) {
                    const cmd = await activationProvider.getActivationCommands(resource, shell.value);

                    assert.equal(cmd, undefined);
                }
            });
            test('No commands for an interpreter that is not Pipenv', async () => {
                const nonPipInterpreterTypes = getNamesAndValues<InterpreterType>(InterpreterType)
                    .filter(t => t.value !== InterpreterType.Pipenv);
                for (const interpreterType of nonPipInterpreterTypes) {
                    when(interpreterService.getActiveInterpreter(resource)).thenResolve({ type: interpreterType } as any);

                    for (const shell of getNamesAndValues<TerminalShellType>(TerminalShellType)) {
                        const cmd = await activationProvider.getActivationCommands(resource, shell.value);

                        assert.equal(cmd, undefined);
                    }
                }
            });
            test('pipenv shell is returned for pipenv interpeter', async () => {
                when(interpreterService.getActiveInterpreter(resource)).thenResolve({ type: InterpreterType.Pipenv } as any);

                for (const shell of getNamesAndValues<TerminalShellType>(TerminalShellType)) {
                    const cmd = await activationProvider.getActivationCommands(resource, shell.value);

                    assert.deepEqual(cmd, ['pipenv shell']);
                }
            });
        });
    });
});