import { setup } from '@storybook/vue3';
import { Quasar, Notify, Dialog, Loading } from 'quasar';
import langFa from 'quasar/lang/fa-IR';
import 'quasar/dist/quasar.rtl.css';
import 'quasar/src/css/index.sass';
import '@/assets/styles/main.scss';

setup((app) => {
  app.use(Quasar, {
    lang: langFa,
    rtl: true,
    plugins: {
      Notify,
      Dialog,
      Loading,
    },
    config: {
      notify: {
        position: 'top',
        progress: true,
        timeout: 3000,
        textColor: 'white',
        actions: [{ icon: 'close', color: 'white' }],
      },
    },
  });
});

export const parameters = {
  layout: 'centered',
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
