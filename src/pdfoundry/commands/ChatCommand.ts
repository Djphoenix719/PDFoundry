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
    protected abstract async run(args: string[]): Promise<void>;

    // </editor-fold>
}
