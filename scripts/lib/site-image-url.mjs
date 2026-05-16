import path from 'node:path';
import { publicImageUrl } from './project-media.mjs';

export const DEFAULT_SITE_BASE_URL = 'https://sptoydoctor.com.au';

/** HTTPS directory on the live site that contains this project's media files. */
export function projectSitePublicBase(siteBaseUrl, projectFolderName) {
  const base = siteBaseUrl.replace(/\/$/, '');
  return `${base}/projects/${encodeURIComponent(projectFolderName)}`;
}

export function projectSiteImageUrl(siteBaseUrl, projectFolderName, imageFileName) {
  return publicImageUrl(projectSitePublicBase(siteBaseUrl, projectFolderName), imageFileName);
}
