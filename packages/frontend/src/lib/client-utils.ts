export const scrollToPost = async (postId?: string) => {
  let postElement: HTMLElement | null = null;
  if (postId) {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve: (post: HTMLElement | null) => void) =>
      //wait for DOM to update
      setTimeout(() => {
        postElement = document.getElementById(postId);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        resolve(postElement);
      }, 200),
    );
  }
};

export const refetchAndScrollToPost = async (refetch: () => Promise<any>, postId?: string) => {
  await refetch();
  const post = await scrollToPost(postId);
  setTimeout(() => {
    if (post) post.style.setProperty('opacity', '1');
  }, 1000);
};
