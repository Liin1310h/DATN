export const ACCOUNT_LOCKED_EVENT = "expense-tracker:account-locked";
export const ACCOUNT_UNLOCKED_EVENT = "expense-tracker:account-unlocked";

export type AccountLockedEventDetail = {
  message: string;
};

export type AccountUnlockedEventDetail = {
  message: string;
};

export const emitAccountLocked = (message: string) => {
  window.dispatchEvent(
    new CustomEvent<AccountLockedEventDetail>(ACCOUNT_LOCKED_EVENT, {
      detail: {
        message,
      },
    }),
  );
};

export const emitAccountUnlocked = (message: string) => {
  window.dispatchEvent(
    new CustomEvent<AccountUnlockedEventDetail>(ACCOUNT_UNLOCKED_EVENT, {
      detail: {
        message,
      },
    }),
  );
};
