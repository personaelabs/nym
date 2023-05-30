import { UserAvatar } from './global/UserAvatar';
import { useContext, useEffect, useState } from 'react';
import { ClientName, NameType, UserContextType } from '@/types/components';
import useName from '@/hooks/useName';
import { UserContext } from '@/pages/_app';
import { useAccount } from 'wagmi';

export const MyProfile = () => {
  const { address } = useAccount();
  const { nymOptions, isValid } = useContext(UserContext) as UserContextType;
  const { name } = useName({ userId: address });

  const [openProfile, setOpenProfile] = useState(false);
  const [localAddress, setLocalAddress] = useState('');

  const getUserIdFromName = (user: ClientName): string => {
    if (user.name) {
      return user.type === NameType.PSEUDO ? `${user.name}-${user.nymHash}` : user.name;
    } else return '';
  };

  useEffect(() => {
    // Prevents server side mismatch with address. Idk why
    if (address) setLocalAddress(address);
  }, [address]);

  return (
    <>
      {localAddress && isValid ? (
        <div className="relative cursor-pointer" onClick={() => setOpenProfile(!openProfile)}>
          <UserAvatar width={50} userId={localAddress} />
          {openProfile ? (
            <div className="max-w-[150px] absolute top-full right-0 bg-white mt-2 border border-gray-200 rounded-xl cursor-pointer p-2">
              <p className="secondary px-2">My identities</p>
              <a href={`/users/${localAddress}`}>
                <div className="w-full flex justify-between gap-2 px-2 py-2.5 rounded-xl hover:bg-gray-100">
                  <div className="w-full flex justify-between items-center gap-2">
                    <div className="flex gap-2 w-full">
                      <UserAvatar type={NameType.DOXED} userId={localAddress} width={20} />
                      <p className="shrink overflow-hidden text-ellipsis whitespace-nowrap">
                        {name}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
              {nymOptions &&
                nymOptions.map((nym) => (
                  <div
                    key={nym.nymSig}
                    className="w-full flex justify-between gap-2 px-2 py-2.5 rounded-xl hover:bg-gray-100"
                  >
                    <a href={`/users/${getUserIdFromName(nym)}`}>
                      <div className="w-full flex justify-between items-center gap-2">
                        <div className="flex gap-2 w-full">
                          <UserAvatar
                            type={NameType.PSEUDO}
                            userId={getUserIdFromName(nym)}
                            width={20}
                          />
                          <p className="shrink overflow-hidden text-ellipsis whitespace-nowrap">
                            {nym.name}
                          </p>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
};
