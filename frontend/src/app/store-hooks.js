import { useDispatch, useSelector } from "react-redux";

// Thin typed wrappers around Redux's hooks. Only `useAppDispatch` is used
// today (by ChatWindow for manual cache invalidation), but pairing them
// keeps the convention consistent for future slices.

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
