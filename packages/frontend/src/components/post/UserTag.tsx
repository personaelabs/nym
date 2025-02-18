import { UserContext } from '@/pages/_app';
import { UserAvatar } from '../global/UserAvatar';
import useName from '@/hooks/useName';
import { NameType, UserContextType } from '@/types/components';
import { useContext } from 'react';
import { fromNowDate, splitNym } from '@/lib/client-utils';
import { userTag as TEXT } from '@/lib/text';
import { useAccount } from 'wagmi';

interface UserTagProps {
  userId: string;
  avatarWidth?: number;
  timestamp?: Date;
  lastActive?: Date | null;
}
export const UserTag = (props: UserTagProps) => {
  const { userId, avatarWidth, timestamp, lastActive } = props;
  const { name, subName, isEns, isDoxed } = useName({ userId });
  const { isMobile, pushRoute } = useContext(UserContext) as UserContextType;

  return (
    <div
      className="min-w-0 shrink grow basis-1/2 max-w-full flex gap-2 items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <UserAvatar
        type={isDoxed ? NameType.DOXED : NameType.PSEUDO}
        userId={userId}
        width={avatarWidth || 30}
      />
      <div className="min-w-0 flex flex-col gap-1">
        <div
          className="font-semibold breakText outline-none cursor-pointer whitespace-pre-wrap"
          onClick={() => pushRoute(`/users/${userId}`)}
        >
          <p>
            <span className="hover:underline">
              {!isEns && isDoxed ? name.substring(0, 7) + '...' : name}{' '}
            </span>
            <span className="text-xs text-gray-500 font-normal">
              {subName ? subName.substring(0, 7) + '...' : ''}
            </span>
          </p>
        </div>

        {lastActive && (
          <div className="flex gap-1 shrink-0 secondary">
            {!isMobile && <p>{TEXT.lastActive} </p>}
            <p className="font-semibold">{fromNowDate(lastActive)}</p>
          </div>
        )}
      </div>

      {timestamp && (
        <div className="shrink-0 flex gap-2">
          <p className="secondary">{TEXT.dash}</p>
          <p className="secondary">{fromNowDate(timestamp)}</p>
        </div>
      )}
    </div>
  );
};
