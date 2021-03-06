/**
 * Copyright 2020-present NAVER Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as appRoot from 'app-root-path';

export async function openMetadatEditor(
    viewType: string,
    tabTitle: string,
    context: vscode.ExtensionContext,
    parameters: Record<string, any>,
    annotations: Record<string, any>,
    update: (parameter: object, annotation: object) => Promise<void>
): Promise<void> {
    const panel = vscode.window.createWebviewPanel(viewType, tabTitle, vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
    });
    const nodeModulesDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'node_modules'));
    const nodeModulePath = panel.webview.asWebviewUri(nodeModulesDiskPath);

    const webviewTemplateDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, 'webview-template')
    );
    const webviewTemplatePath = panel.webview.asWebviewUri(webviewTemplateDiskPath);

    // render webview html
    const html = await fs.promises.readFile(
        appRoot.resolve('webview-template/metadataEditor.html'),
        'utf-8'
    );
    panel.webview.html = html
        .replace(/{{nodeModulePath}}/gi, nodeModulePath.toString())
        .replace(/{{webviewTemplatePath}}/gi, webviewTemplatePath.toString())
        .replace(/{{title}}/gi, tabTitle);

    // add message litener
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'initialized') {
            panel.webview.postMessage({
                command: 'setEditor',
                parameters: JSON.stringify(parameters),
                annotations: JSON.stringify(annotations),
            });
        } else if (message.command === 'update') {
            await update(JSON.parse(message.parameters), JSON.parse(message.annotations));
        }
    });
}
