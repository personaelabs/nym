import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { IPostPreview, IUserUpvote, RawNotifications } from '@/types/api';
import { ClientName } from '@/types/components';
import {
  Notification,
  NotificationMap,
  NotificationType,
  setReadArgs,
} from '@/types/notifications';
import { getNymOptions } from './useUserInfo';
import { fromNowDate, getUserIdFromName } from '@/lib/client-utils';
import { useAccount } from 'wagmi';
import useError from './useError';

export const notificationsListToMap = (notifications: Notification[]) => {
  const map = notifications.reduce((result: NotificationMap, obj) => {
    result[obj.id] = obj;
    return result;
  }, {});
  return map;
};

export const notificationsMapToOrderedList = (map: NotificationMap) => {
  const sortedList = Object.entries(map)
    // @ts-expect-error timestamp
    .sort(([keyA, objA], [keyB, objB]) => new Date(objB.timestamp) - new Date(objA.timestamp))
    .map(([key, obj]) => obj);
  return sortedList;
};

export const getNotificationsInLocalStorage = (address: string): NotificationMap => {
  const notifications = localStorage.getItem(`notifications-${address}`);
  if (notifications) {
    return JSON.parse(notifications) as NotificationMap;
  }
  return {};
};

export const setNotificationsInLocalStorage = (address: string, map: NotificationMap) => {
  localStorage.setItem(`notifications-${address}`, JSON.stringify(map));
  return map;
};

const cleanRelevantPost = (post: IPostPreview, type: NotificationType): Notification => {
  const { title, userId, id, body, timestamp } = post;

  const res = {
    id,
    postId: id,
    read: false,
    userId,
    timestamp,
    type,
    title,
    body,
  };

  // Set Notification title for each type
  if (post.parent && type === NotificationType.DirectReply) {
    res.title = post.parent.body;
  }
  if (post.root && type === NotificationType.DiscussionReply) {
    res.title = post.root.title;
  }

  return res;
};

const cleanRelevantUpvote = (upvote: IUserUpvote): Notification => {
  return {
    id: upvote.id,
    postId: upvote.post.id,
    read: false,
    userId: upvote.address,
    type: NotificationType.Upvote,
    timestamp: upvote.timestamp,
    title: upvote.post.title || upvote.post.root?.title || '',
    body: upvote.post.body,
  };
};

const buildNotifications = (raw: RawNotifications, myIds: string[]): Notification[] => {
  // Using reduce here to filter and map in one function for performance.

  // First, handle posts
  const posts = raw.posts;

  const relevantPosts = posts.reduce((result: Notification[], p) => {
    const rootAuthor = p.root?.userId.toLowerCase();
    const parentAuthor = p.parent?.userId.toLowerCase();
    // If rootAuthor is one of my ids, this is discussion reply.
    // Ignore if post is one of my ids, no notifications for replying to myself.
    if (rootAuthor && myIds.includes(rootAuthor) && !myIds.includes(p.userId)) {
      result.push(cleanRelevantPost(p, NotificationType.DiscussionReply));
    }
    // If parentAuthor is one of my ids, this is a direct reply
    else if (parentAuthor && myIds.includes(parentAuthor) && !myIds.includes(p.userId)) {
      result.push(cleanRelevantPost(p, NotificationType.DirectReply));
    }
    return result;
  }, []);

  // Next handle upvotes
  const upvotes = raw.upvotes;

  const relevantUpvotes = upvotes.reduce((result: Notification[], u) => {
    // If I made the post, tell me about upvotes for that post.
    if (myIds.includes(u.post.userId)) result.push(cleanRelevantUpvote(u));
    return result;
  }, []);

  return relevantPosts.concat(relevantUpvotes);
};

export const useNotifications = () => {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const unread = useMemo(() => notifications.filter((n) => !n.read), [notifications]);
  const [refreshTime, setRefreshTime] = useState<Date | null>(null);
  const [lastRefresh, setLastRefresh] = useState('');
  const { errorMsg, setError } = useError();

  const setAsRead = ({ address, id, markAll }: setReadArgs) => {
    if (notifications && address) {
      // update notifications in memory
      const newNotifications = notifications.map((n) => {
        if (markAll || id === n.id) return { ...n, read: true };
        return n;
      });
      setNotifications(newNotifications);
      const map = notificationsListToMap(newNotifications);
      // write new map to local storage
      setNotificationsInLocalStorage(address, map);
    }
  };

  const fetchNotifications = async (args: { address: string; nymOptions: ClientName[] }) => {
    setIsLoading(true);
    const { address, nymOptions } = args;
    const myUserIds = nymOptions.map((n) => getUserIdFromName(n).toLowerCase());
    myUserIds.push(address.toLowerCase());

    try {
      const raw = await axios.get<RawNotifications>('/api/v1/notifications', {
        params: { startTime: '', endTime: '' },
      });

      const rawNotifications = raw.data;
      // Filter the list for posts with a rootId or parentId authored by my identities.
      // Map to determine if it is a direct or discussion reply
      const serverNotifications = buildNotifications(rawNotifications, myUserIds);

      // First, get localStorage notifications
      let localNotifications = getNotificationsInLocalStorage(address);
      if (Object.keys(localNotifications).length > 0) {
        // Add new posts if they don't exist yet.
        serverNotifications.map((n) => {
          if (!(n.id in localNotifications)) {
            // Update the `notifications object`
            localNotifications[n.id] = n;
          }
        });
      } else {
        // First time localStorage is used, we set all data to it.
        localNotifications = notificationsListToMap(serverNotifications);
      }

      // Add the new notifications map to localStorage
      setNotificationsInLocalStorage(address, localNotifications);

      // Convert map to ordered list and export from hook.
      setNotifications(notificationsMapToOrderedList(localNotifications));
      setIsLoading(false);
      setRefreshTime(new Date());
    } catch (error) {
      setIsLoading(false);
      setError(error);
    }
  };

  useEffect(() => {
    // Getting nymOptions to avoid an error where sometime nymOptions are out of sync with the address
    const nymOptions = getNymOptions(address);
    if (!address || !nymOptions) {
      return;
    }
    fetchNotifications({ address, nymOptions });
  }, [address]);

  const calculateLastRefresh = (refreshTime: Date) => {
    const fromNow = fromNowDate(refreshTime);
    setLastRefresh(fromNow);
  };

  useEffect(() => {
    if (refreshTime) {
      calculateLastRefresh(refreshTime);
      const poll = setInterval(() => calculateLastRefresh(refreshTime), 5000);

      return () => {
        clearInterval(poll);
      };
    }
  }, [refreshTime]);

  return {
    notifications,
    unread,
    setAsRead,
    setNotifications,
    fetchNotifications,
    isLoading,
    lastRefresh,
    errorMsg,
  };
};
