import Api from '../../Api';

/**
 * Github link header button.
 */
export const BUTTON_GITHUB = {
    class: 'pdf-sheet-github',
    icon: 'fas fa-external-link-alt',
    label: 'PDFoundry',
    onclick: () => window.open('https://github.com/Djphoenix719/PDFoundry', '_blank'),
};

/**
 * Manual link header button.
 */
export const BUTTON_HELP = {
    class: 'pdf-sheet-manual',
    icon: 'fas fa-question-circle',
    label: 'Help',
    onclick: () => Api.showHelp(),
};
