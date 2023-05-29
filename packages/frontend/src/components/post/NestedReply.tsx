import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { IPostWithReplies } from '@/types/api';
import { PrefixedHex } from '@personaelabs/nymjs';
import { PostWriter } from '../userInput/PostWriter';
import { SingleReply } from './SingleReply';

interface IReplyProps extends IPostWithReplies {
  depth: number;
  innerReplies: React.ReactNode[] | React.ReactNode;
  proof: string;
  childrenLength: number;
  onSuccess: () => void;
  showReplyWriter: boolean;
}
export const resolveNestedReplyThreads = (
  allPosts: IPostWithReplies[],
  depth: number,
  postsVisibilityMap: Record<string, number> | undefined,
  setPostsVisibility: any,
  onSuccess: () => void,
  trail: string[],
  additionalDataKeys: string[][],
  setAdditionalDataKeys: any,
  writerToShow?: string,
) => {
  const replyNodes: React.ReactNode[] = [];
  const proof = '';
  if (!postsVisibilityMap || (allPosts.length > 0 && !postsVisibilityMap[allPosts[0].id])) {
    return (
      <div>
        <button
          onClick={() => {
            if (depth % 5 === 0 && allPosts.length === 0) {
              const newKeys = [...additionalDataKeys];
              newKeys.push(trail);
              setAdditionalDataKeys(newKeys);
            }

            const newPostsVisibility = { ...postsVisibilityMap };
            allPosts.forEach((post) => {
              newPostsVisibility[post.id] = 1;
            });
            setPostsVisibility(newPostsVisibility);
          }}
        >
          {allPosts.length} more replies
        </button>
      </div>
    );
  }
  for (const post of allPosts) {
    console.log(`nest`, post.id);
    const newTrail = [...trail];
    newTrail.push(post.id);

    replyNodes.push(
      <NestedReply
        {...post}
        key={post.id}
        showReplyWriter={writerToShow === post.id}
        depth={depth}
        innerReplies={resolveNestedReplyThreads(
          post.replies,
          depth + 1,
          postsVisibilityMap,
          setPostsVisibility,
          onSuccess,
          newTrail,
          additionalDataKeys,
          setAdditionalDataKeys,
          writerToShow,
        )}
        proof={proof}
        childrenLength={post.replies.length}
        onSuccess={onSuccess}
      />,
    );
  }
  return replyNodes;
};

export const NestedReply = (replyProps: IReplyProps) => {
  const {
    id,
    body,
    userId,
    timestamp,
    upvotes,
    depth,
    innerReplies,
    childrenLength,
    onSuccess,
    showReplyWriter,
  } = replyProps;

  const postInfo = { id, body, userId, timestamp, upvotes };
  const [showPostWriter, setShowPostWriter] = useState<boolean>(showReplyWriter);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current && showReplyWriter) {
      setTimeout(() => divRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [showReplyWriter]);

  return (
    <div
      ref={divRef}
      id={id}
      className="flex flex-col gap-2"
      style={{ marginLeft: `${depth * 10}px`, width: `calc(100% - ${depth * 10}px)` }}
    >
      <SingleReply
        {...postInfo}
        replyCount={childrenLength}
        onSuccess={onSuccess}
        replyOpen={showPostWriter}
        handleReply={() => setShowPostWriter(!showPostWriter)}
      >
        {showPostWriter ? (
          <PostWriter
            parentId={id as PrefixedHex}
            onSuccess={onSuccess}
            handleCloseWriter={() => setShowPostWriter(false)}
          />
        ) : null}
        {innerReplies}
      </SingleReply>
    </div>
  );
};
