import { PostProps } from '@/types/components';
import { ReplyCount } from './ReplyCount';
import { UserTag } from './UserTag';
import { SingleReply } from './SingleReply';
import useName from '@/hooks/useName';
import { CopyLink } from './CopyLink';

/** Note: Post.tsx handles the state of the modal and formats the timestamp */

export const PostPreview = (postProps: PostProps) => {
  const {
    title,
    id,
    body,
    upvotes,
    timestamp,
    _count,
    userId,
    parent,
    root,
    showUserHeader,
    handleOpenPost,
    onSuccess,
  } = postProps;

  const postInfo = { id, body, upvotes, timestamp, userId };

  const { name: userName } = useName({ userId });
  const { name: rootName } = useName({ userId: root?.userId });
  useName({ userId: root?.userId });

  return (
    <>
      <div
        id={id}
        onClick={() => handleOpenPost('')}
        className="rounded-2xl transition-all shadow-sm bg-white p-3 md:px-5 md:py-4 flex flex-col gap-4 justify-between border border-gray-200 hover:border-gray-300 hover:cursor-pointer w-full"
      >
        {root ? (
          <div className="flex flex-col gap-2">
            <p>
              <a href={`/users/${userId}`} className="postDetail hover:underline">
                {userName}
              </a>
              <span className="secondary"> commented on </span>
              <span className="postDetail hover:underline">{root.title}</span>
            </p>
            <a href={`/users/${root.userId}`} className="w-max secondary">
              Posted by <strong className="hover:underline">{rootName}</strong>
            </a>
          </div>
        ) : (
          <>
            {showUserHeader ? (
              <p>
                <span className="secondary">Posted by </span>
                <a href={`/users/${userId}`} className="postDetail hover:underline">
                  {userName}
                </a>
              </p>
            ) : null}
            <h4 className="tracking-tight">{title}</h4>
          </>
        )}
        {parent ? (
          <div className="flex flex-col gap-2">
            <UserTag userId={parent.userId} timestamp={parent.timestamp} />
            <div className="flex flex-col gap-2 ml-3 pl-2 border-l border-dotted border-gray-300">
              <span>{parent.body}</span>
              <div className="p-4 rounded-xl bg-gray-50" style={{ marginLeft: 10 }}>
                <SingleReply
                  {...postInfo}
                  replyCount={_count.descendants}
                  onSuccess={onSuccess}
                  replyOpen={false}
                  handleReply={(writerToShow: string) => handleOpenPost(writerToShow)}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <span>{body}</span>
            <div className="flex justify-between items-center">
              <UserTag userId={userId} timestamp={timestamp} />
              <div className="flex gap-4">
                <ReplyCount count={_count.descendants} />
                <CopyLink id={id} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
