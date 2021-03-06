import { config as modelConfig } from '@trailimage/models';
import { provider } from './provider';
import { Flickr } from '@toba/flickr';

export const postCount = 168;

console.debug = jest.fn();

provider.configure({
   featureSets: [{ id: '72157632729508554', title: 'Ruminations' }],
   api: {
      appID: '72157631007435048',
      userID: '60950751@N04',
      excludeSets: ['72157631638576162'],
      excludeTags: [
         'Idaho',
         'United States of America',
         'Abbott',
         'LensTagger',
         'Boise'
      ],
      timeZoneOffset: -1,
      setPhotoSizes: [Flickr.SizeCode.Large1024],
      useCache: false,
      searchPhotoSizes: [],
      maxCacheSize: 10,
      retryDelay: 10,
      maxRetries: 1,
      auth: {
         apiKey: 'FLICKR_API_KEY',
         secret: 'FLICKR_SECRET',
         callback: 'http://www.trailimage.com/auth/flickr',
         token: {
            access: 'FLICKR_ACCESS_TOKEN',
            secret: 'FLICKR_TOKEN_SECRET'
         }
      }
   }
});

modelConfig.artistsToNormalize = /Jason/;
modelConfig.providers.post = provider;
