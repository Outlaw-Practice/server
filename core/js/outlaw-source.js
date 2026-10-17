/** Source offer in the Nextcloud 35 About/onboarding dialog. */
(() => {
    const attach = () => {
        const offer = document.getElementById('outlaw-source-offer');
        const dialog = document.querySelector('#firstrunwizard .modal-container');
        if (!offer || !dialog || dialog.querySelector('.outlaw-source-offer')) {
            return;
        }
        const link = document.createElement('a');
        link.className = 'outlaw-source-offer';
        link.href = offer.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Source code for this installation';
        dialog.append(link);
    };
    const start = () => {
        new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
        attach();
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
