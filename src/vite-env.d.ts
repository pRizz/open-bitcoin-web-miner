/// <reference types="vite/client" />
/// <reference types="@webgpu/types" />

interface ImportMetaEnv {
  readonly PACKAGE_VERSION: string;
  readonly BUILD_TIME: string;
  readonly GIT_COMMIT_SHA: string;
  readonly GIT_COMMIT_SHORT_SHA: string;
  readonly GIT_COMMIT_URL: string;
  readonly GIT_BRANCH_NAME: string;
  readonly DEPLOY_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
