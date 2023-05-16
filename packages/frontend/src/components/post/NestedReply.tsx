import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { IPostWithReplies } from '@/types/api';
import { ReplyCount } from './ReplyCount';
import { UserTag } from './UserTag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReply } from '@fortawesome/free-solid-svg-icons';
import { Upvote } from '../Upvote';
import { PrefixedHex } from '@personaelabs/nymjs';
import { PostWriter } from '../userInput/PostWriter';

interface IReplyProps extends IPostWithReplies {
  depth: number;
  innerReplies: React.ReactNode;
  profileImgURL: string;
  proof: string;
  childrenLength: number;
  createdAt: Date;
}
export const resolveNestedReplyThreads = (allPosts: IPostWithReplies[], depth: number) => {
  const replyNodes: React.ReactNode[] = [];
  const profileImgURL = '';
  const proof = '';
  for (const post of allPosts) {
    replyNodes.push(
      <NestedReply
        {...post}
        key={post.id}
        depth={depth}
        createdAt={new Date(post.timestamp)}
        innerReplies={resolveNestedReplyThreads(post.replies, depth + 1)}
        profileImgURL={profileImgURL}
        proof={proof}
        childrenLength={post.replies.length}
      />,
    );
  }
  return replyNodes;
};

export const NestedReply = (replyProps: IReplyProps) => {
  const {
    depth,
    id,
    body,
    createdAt,
    userId,
    innerReplies,
    profileImgURL,
    childrenLength,
    upvotes,
  } = replyProps;
  const dateFromDescription = useMemo(() => {
    const date = dayjs(createdAt);
    // Dayjs doesn't have typings on relative packages so we have to do this
    // @ts-ignore
    return date.fromNow();
  }, [createdAt]);

  const [showPostWriter, setShowPostWriter] = useState<boolean>(false);

  return (
    // TODO: fix border here
    <div
      className="flex flex-col gap-2 pl-2 border-l border-dotted border-gray-300"
      key={id}
      style={{ marginLeft: `${depth * 20}px` }}
    >
      <UserTag imgURL={profileImgURL} userId={userId} date={dateFromDescription} />
      <span>{body}</span>
      <div className="flex justify-between items-center py-2 border-t border-gray-300">
        <Upvote upvotes={upvotes} postId={id}>
          <p>{upvotes.length}</p>
        </Upvote>
        <div className="flex gap-4 justify-center items-center">
          <ReplyCount count={childrenLength} />
          <div
            className="flex gap-2 items-center cursor-pointer hoverIcon"
            onClick={() => setShowPostWriter(!showPostWriter)}
          >
            <FontAwesomeIcon icon={faReply} color={showPostWriter ? '#0E76FD' : ''} />
            <p className={`text-gray-700 ${showPostWriter ? 'font-bold' : ''}`}>Reply</p>
          </div>
        </div>
      </div>
      {showPostWriter ? (
        <PostWriter parentId={id as PrefixedHex} setShowWriter={setShowPostWriter} />
      ) : null}
      {innerReplies}
    </div>
  );
};
