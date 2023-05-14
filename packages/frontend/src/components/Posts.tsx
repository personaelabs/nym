import { motion } from 'framer-motion';
import { Post } from '@/components/Post';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { IRootPost } from '@/types/api';
import Spinner from './Spinner';
import ConnectWallet from './ConnectWallet';
import { MainButton } from './MainButton';
import { useState } from 'react';
import { NewPost } from './NewPost';

const getPosts = async () => (await axios.get<IRootPost[]>('/api/v1/posts')).data;

export default function Posts() {
  const { isLoading, data: posts } = useQuery<IRootPost[]>({
    queryKey: ['posts'],
    queryFn: getPosts,
    retry: 1,
    enabled: true,
    staleTime: 1000,
  });

  const [newPostOpen, setNewPostOpen] = useState(false);

  return (
    <>
      <NewPost isOpen={newPostOpen} handleClose={() => setNewPostOpen(false)} />
      <main className="flex w-full flex-col justify-center items-center">
        <div className="w-full bg-gray-50 flex flex-col justify-center items-center">
          <div className="bg-black dots w-full">
            <div className="pt-8">
              <nav className="pr-6 flex justify-end">
                <ConnectWallet />
              </nav>
              <div className="max-w-7xl mx-auto pt-12 pb-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center md:text-center max-w-2xl mx-auto">
                  <motion.h1
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="leading-[40px] md:leading-14"
                  >
                    Give Feedback On Proposals Anonymously
                  </motion.h1>
                  <motion.h4
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-4 md:leading-8 font-normal text-white"
                  >
                    Anoun allows noun-holders to give feedback on proposals while maintaining their
                    privacy using zero-knowledge proofs.{' '}
                  </motion.h4>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-40" src="nouns.png" alt="nouns" />
            </div>
          </div>
          <div className="bg-gray-50 min-h-screen w-full">
            <div className="flex flex-col gap-8 max-w-3xl mx-auto py-5 md:py-10 px-3 md:px-0">
              <div className="flex justify-end">
                <MainButton
                  color="blue"
                  message="Start Discussion"
                  loading={false}
                  handler={() => setNewPostOpen(true)}
                />
              </div>
              {isLoading ? (
                <>
                  <Spinner />
                </>
              ) : posts ? (
                <>
                  {posts.map((post) => (
                    <Post key={post.id} {...post} userId={post.userId} />
                  ))}
                </>
              ) : // TODO: handle error state here
              null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
