import { faCircleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAccount, useSignTypedData } from 'wagmi';
import { submitUpvote } from '@/lib/actions';
import { useContext, useMemo, useRef, useState } from 'react';
import { UpvoteWarning } from './UpvoteWarning';
import { ClientUpvote, UserContextType } from '@/types/components';
import { ReactNode } from 'react';
import { WalletWarning } from './WalletWarning';
import { Modal } from './global/Modal';
import { RetryError } from './global/RetryError';
import useError from '@/hooks/useError';
import { UserContext } from '@/pages/_app';
import { UserName } from './global/UserName';
import { upvote as TEXT } from '@/lib/text';
import { Tooltip } from './global/Tooltip';

interface UpvoteIconProps {
  upvotes: ClientUpvote[];
  postId: string;
  children: ReactNode;
  col?: boolean;
  onSuccess: () => void;
}

export const Upvote = (props: UpvoteIconProps) => {
  const { upvotes, postId, col, children, onSuccess } = props;
  const { address } = useAccount();
  const { isValid } = useContext(UserContext) as UserContextType;
  const { errorMsg, setError, clearError, isError } = useError();

  const { signTypedDataAsync } = useSignTypedData();
  const getHasUpvoted = () => {
    if (!address) return false;
    return upvotes.some((v) => v.address === address.toLowerCase());
  };
  const hasUpvoted = useMemo(getHasUpvoted, [address, upvotes]);

  const [showVoteWarning, setShowVoteWarning] = useState(false);
  const [showWalletWarning, setShowWalletWarning] = useState(false);
  const [loadingUpvote, setLoadingUpvote] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const upvoteHandler = async () => {
    try {
      clearError();
      setLoadingUpvote(true);
      await submitUpvote(postId, signTypedDataAsync);
      setLoadingUpvote(false);
      onSuccess();
      setShowVoteWarning(false);
    } catch (error) {
      setError(error);
      setLoadingUpvote(false);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    if (!address || !isValid) {
      setShowWalletWarning(true);
      return;
    }
    if (hasUpvoted) return;
    setShowVoteWarning(true);
  };

  const handleModalClose = (handler: (val: boolean) => void) => {
    handler(false);
    if (buttonRef.current) buttonRef.current.focus();
  };
  return (
    <>
      <Modal isOpen={isError} width="50%" handleClose={clearError}>
        <RetryError message={TEXT.fetchError} error={errorMsg} refetchHandler={upvoteHandler} />
      </Modal>
      <UpvoteWarning
        isOpen={showVoteWarning}
        handleClose={() => handleModalClose(setShowVoteWarning)}
        upvoteHandler={upvoteHandler}
        loadingUpvote={loadingUpvote}
      />
      <WalletWarning
        isOpen={showWalletWarning}
        handleClose={() => handleModalClose(setShowWalletWarning)}
        action={TEXT.action}
      />
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`flex ${
          col ? 'flex-col' : 'flex-row'
        } gap-1 justify-center items-center cursor-pointer h-min`}
      >
        <div className="hoverIcon text-gray-300">
          <FontAwesomeIcon icon={faCircleUp} className={`${hasUpvoted ? 'text-blue' : ''}`} />
        </div>
        <div
          className="relative"
          onPointerEnter={() => setShowUsers(true)}
          onPointerLeave={() => setShowUsers(false)}
        >
          <div className="hover:font-bold">{children}</div>
          {showUsers && upvotes.length > 0 && (
            <Tooltip refElem={buttonRef.current} maxWidth={150}>
              <div className="mt-2 w-max max-w-[150px] bg-gray-800 rounded-xl p-2">
                <div className="min-w-0 shrink text-left">
                  {upvotes.slice(0, 9).map((u) => {
                    return (
                      <p key={u.id} className="w-full text-white breakText">
                        <UserName userId={u.address} />
                      </p>
                    );
                  })}
                  {upvotes.length > 9 && (
                    <p className="w-full text-white breakText">
                      {TEXT.and} {upvotes.length - 9} {TEXT.more}
                    </p>
                  )}
                </div>
              </div>
            </Tooltip>
          )}
        </div>
      </button>
    </>
  );
};
