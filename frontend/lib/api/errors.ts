import axios from 'axios';

export type YoutubeErrorKind = 'no-account' | 'no-videos' | 'auth' | 'unknown';

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

const extractMessage = (payload: ApiErrorPayload | string | undefined): string | undefined => {
  if (!payload) return undefined;
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload.message)) return payload.message.join(', ');
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.error === 'string') return payload.error;
  return undefined;
};

export const getYoutubeErrorInfo = (error: unknown): { kind: YoutubeErrorKind; message: string } => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const payload = error.response?.data as ApiErrorPayload | string | undefined;
    const rawMessage = extractMessage(payload) || error.message || 'Unknown error';
    const normalized = rawMessage.toLowerCase();

    if (status === 401 || status === 403) {
      return { kind: 'auth', message: rawMessage };
    }

    if (status === 404) {
      if (normalized.includes('video')) {
        return { kind: 'no-videos', message: rawMessage };
      }
      return { kind: 'no-account', message: rawMessage };
    }

    if (normalized.includes('no videos') || normalized.includes('no video')) {
      return { kind: 'no-videos', message: rawMessage };
    }

    if (
      normalized.includes('not connected') ||
      normalized.includes('no account') ||
      normalized.includes('no channel') ||
      normalized.includes('connect')
    ) {
      return { kind: 'no-account', message: rawMessage };
    }

    return { kind: 'unknown', message: rawMessage };
  }

  if (error instanceof Error) {
    return { kind: 'unknown', message: error.message };
  }

  return { kind: 'unknown', message: 'Unknown error' };
};

export const getYoutubeErrorToastMessage = (error: unknown): string => {
  const info = getYoutubeErrorInfo(error);
  switch (info.kind) {
    case 'auth':
      return 'Your session expired. Please sign in again.';
    case 'no-account':
      return 'No YouTube account connected yet. Connect YouTube and try again.';
    case 'no-videos':
      return 'No YouTube videos found yet. Upload a video and try again.';
    default:
      return info.message || 'We could not sync YouTube data.';
  }
};

export const getYoutubeEmptyState = (error: unknown): { title: string; description: string } => {
  const info = getYoutubeErrorInfo(error);

  switch (info.kind) {
    case 'no-account':
      return {
        title: 'Connect your YouTube account',
        description: 'Link your YouTube channel to unlock audience analytics and content insights.',
      };
    case 'no-videos':
      return {
        title: 'No videos found yet',
        description: 'Upload a video to your channel and sync again to see performance data.',
      };
    case 'auth':
      return {
        title: 'Session expired',
        description: 'Please sign in again to access your YouTube analytics.',
      };
    default:
      return {
        title: 'No audience data yet',
        description: 'Connect your YouTube account to see live audience analytics here.',
      };
  }
};
