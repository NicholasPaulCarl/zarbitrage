// Version information for the application
export const APP_VERSION = "2.1.0";
export const APP_NAME = "ZArbitrage";
export const BUILD_DATE = new Date().toISOString().split('T')[0];

export const getVersionInfo = () => {
  return {
    version: APP_VERSION,
    name: APP_NAME,
    buildDate: BUILD_DATE,
    fullVersion: `${APP_NAME} v${APP_VERSION}`
  };
};