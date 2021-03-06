import '@toba/test';
import './.test-data';
import { Flickr } from '@toba/flickr';
import { Photo } from '@trailimage/models';
import { flickr } from './client';
import { loadPhoto, parseDate, photosWithTags } from './photo';

let res: Flickr.SetPhotos | null;

beforeAll(async () => {
   res = await flickr.client.getSetPhotos('id');
   expect(res).not.toBeNull();
});

test('finds photos with tags', async () => {
   const photos: Photo[] = await photosWithTags('tag1', 'tag2');
   expect(photos).toBeInstanceOf(Array);
   expect(photos[0].id).toBe('21365383716');
});

test('converts Flickr date string to Date', () => {
   const d = parseDate('2012-06-17 17:34:33');
   expect(d).toBeInstanceOf(Date);
   expect(d.getDate()).toBe(17);
   expect(d.getMonth()).toBe(5);
});

test.skip('adjusts Flickr date to local timezone', () => {
   const d = parseDate('2012-06-17 17:34:33');
   expect(d.getHours()).toBe(17);
});

test('loads photo from Flickr data', () => {
   const photo = loadPhoto(res!.photo[0], 0);
   expect(photo).toBeDefined();
   expect(photo.id).toBe('8459503474');
   expect(photo.title).toBe('Slow roasted');
   expect(photo.primary).toBe(true);
   expect(photo.longitude).toBe(-117.10555);
   expect(photo.sourceUrl).toBe('flickr.com/photos/trailimage/8459503474');
   expect(photo.tags).toHaveValues(
      'snow',
      'night',
      'fire',
      'washington',
      'abbott',
      'jeremyabbott',
      'jesseabbott'
   );
});
