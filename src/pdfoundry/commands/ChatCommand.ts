/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Chat command processor
 * @internal
 */
export default abstract class ChatCommand {
    // <editor-fold desc="Getters & Setters">

    public get CommandPrefix() {
        return `/pdfoundry`;
    }

    public abstract get CommandName(): string;

    // </editor-fold>
    // <editor-fold desc="Instance Methods">

    /**
     * Execute the command, returning true if the command completes successfully
     * @param content
     */
    public execute(content: string): boolean {
        const realArgs = content.split(' ');
        if (realArgs[0] !== this.CommandPrefix) {
            return false;
        }

        if (realArgs[1] !== this.CommandName) {
            return false;
        }

        // pop first two args
        realArgs.shift();
        realArgs.shift();

        this.run(realArgs)
            .then(() => {
                let message = game.i18n.localize('PDFOUNDRY.COMMANDS.Success');
                message = message.replace('$COMMAND_NAME$', this.CommandName);
                ui.notifications.info(message);
            })
            .catch((error) => {
                let message = game.i18n.localize('PDFOUNDRY.COMMANDS.Failure');
                message = message.replace('$COMMAND_NAME$', this.CommandName);
                ui.notifications.error(message);
                console.error(error);
            });
        return true;
    }

    /**
     * Run the command
     * @param args
     * @protected
     */
    protected abstract run(args: string[]): Promise<void>;

    // </editor-fold>
}
