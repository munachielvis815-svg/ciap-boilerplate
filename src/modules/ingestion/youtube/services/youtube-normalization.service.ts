import { Injectable } from '@nestjs/common';
import { SharedYoutubeNormalizationService } from '@shared/youtube/youtube-normalization';

@Injectable()
export class YoutubeNormalizationService extends SharedYoutubeNormalizationService {}
