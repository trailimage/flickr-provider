import { Flickr, FeatureSet } from '@toba/flickr';
import { slug, is } from '@toba/tools';
import { log } from '@toba/logger';
import {
   Post,
   Photo,
   photoBlog,
   identifyOutliers,
   config
} from '@trailimage/models';
import { flickr } from './provider';
import { load as loadVideoInfo } from './video-info';
import { loadPhoto as loadPhoto } from './photo';
import { timeStampToDate } from '../';

/**
 * Create post from Flickr photo set.
 *
 * @param chronoligical Whether set photos occurred together at a point in time
 */
export function load(
   flickrSet: Flickr.SetSummary | FeatureSet,
   chronological: boolean = true
): Post {
   const p = new Post();

   p.id = flickrSet.id;
   p.chronological = chronological;

   const re = new RegExp(config.subtitleSeparator + '\\s*', 'g');
   const parts = p.originalTitle.split(re);

   p.title = parts[0];

   if (parts.length > 1) {
      p.subTitle = parts[1];
      p.seriesKey = slug(p.title);
      p.partKey = slug(p.subTitle);
      p.key = p.seriesKey + '/' + p.partKey;
   } else {
      p.key = slug(p.originalTitle);
   }
   return p;
}

export const loadInfo = (p: Post): Promise<Post> =>
   flickr.getSetInfo(p.id).then(info => updateInfo(p, info));

export const loadPhotos = (p: Post): Promise<Photo[]> =>
   flickr.getSetPhotos(p.id).then(res => updatePhotos(p, res));

function updateInfo(p: Post, setInfo: Flickr.SetInfo): Post {
   const thumb = `http://farm${setInfo.farm}.staticflickr.com/${
      setInfo.server
   }/${setInfo.primary}_${setInfo.secret}`;

   // removes video information from setInfo.description
   p.video = loadVideoInfo(setInfo);
   p.createdOn = timeStampToDate(setInfo.date_create);
   p.updatedOn = timeStampToDate(setInfo.date_update);
   p.photoCount = setInfo.photos;
   p.description = setInfo.description._content.replace(/[\r\n\s]*$/, '');
   // long description is updated after photos are loaded
   p.longDescription = p.description;
   // http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg
   // http://farm{{info.farm}}.static.flickr.com/{{info.server}}/{{info.primary}}_{{info.secret}}.jpg'
   // thumb URLs may be needed before photos are loaded, e.g. in RSS XML
   p.bigThumbURL = thumb + '.jpg'; // 500px
   p.smallThumbURL = thumb + '_s.jpg';
   p.infoLoaded = true;

   return p;
}

function updatePhotos(p: Post, setPhotos: Flickr.SetPhotos): Photo[] {
   p.photos = setPhotos.photo.map((img, index) => loadPhoto(img, index));

   if (p.photos.length > 0) {
      p.coverPhoto = p.photos.find(img => img.primary);

      if (!is.value(p.coverPhoto)) {
         log.error(`No cover photo defined for ${p.title}`);
         p.coverPhoto = p.photos[0];
      }

      // also updates photo tag keys to full names
      p.photoTagList = photoBlog.photoTagList(p.photos);

      if (p.chronological) {
         identifyOutliers(p.photos);
         const firstDatedPhoto = p.photos.find(i => !i.outlierDate);
         if (is.value(firstDatedPhoto)) {
            p.happenedOn = firstDatedPhoto.dateTaken;
         }
      }

      if (!is.empty(p.description)) {
         p.longDescription = `${p.description} (Includes ${
            p.photos.length
         } photos`;
         p.longDescription +=
            is.value(p.video) && !p.video.empty ? ' and one video)' : ')';
      }

      p.updatePhotoLocations();
   }
   p.photosLoaded = true;

   return p.photos;
}
