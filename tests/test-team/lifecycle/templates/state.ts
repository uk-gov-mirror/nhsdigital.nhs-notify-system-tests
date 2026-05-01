import { StateFile } from 'nhs-notify-system-tests-shared';

export const templatesStateFile = async () => {
  const file = new StateFile(__dirname, process.env.RUN_ID);
  await file.loadFromDisk();
  return file;
};
