import { Modal } from './global/Modal';
import { MainButton } from './MainButton';
import { useAccount } from 'wagmi';
import { UserName } from './global/UserName';
import { UserAvatar } from './global/UserAvatar';
import { NameType } from '@/types/components';
import { upvoteWarning as TEXT } from '@/lib/text';

interface UpvoteWarningProps {
  isOpen: boolean;
  handleClose: () => void;
  upvoteHandler: () => void;
  loadingUpvote: boolean;
}

export const UpvoteWarning = (props: UpvoteWarningProps) => {
  const { isOpen, handleClose, upvoteHandler, loadingUpvote } = props;

  const { address } = useAccount();

  return (
    <Modal isOpen={isOpen} width="60%" handleClose={handleClose}>
      <h3>{TEXT.title}</h3>
      <div className="w-max flex gap-2 items-center rounded-xl px-2 py-2.5 border border-gray-200">
        <UserAvatar type={NameType.DOXED} userId={address as string} width={24} />
        <p className="breakText">
          <UserName userId={address as string} />
        </p>
      </div>
      <p className="text-gray-700">{TEXT.body}</p>
      <div className="flex justify-center">
        <MainButton message={TEXT.buttonText} loading={loadingUpvote} handler={upvoteHandler} />
      </div>
    </Modal>
  );
};
