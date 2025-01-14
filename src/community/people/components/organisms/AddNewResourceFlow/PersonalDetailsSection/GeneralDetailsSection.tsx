import {
  Avatar,
  Box,
  Grid2 as Grid,
  type SelectChangeEvent,
  Stack,
  type Theme,
  useTheme
} from "@mui/material";
import { useFormik } from "formik";
import { DateTime } from "luxon";
import {
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from "react";
import { useDropzone } from "react-dropzone";

import PlusIcon from "~community/common/assets/Icons/PlusIcon";
import RequestCancelCrossIcon from "~community/common/assets/Icons/RequestCancelCrossIcon";
import Icon from "~community/common/components/atoms/Icon/Icon";
import DropdownAutocomplete from "~community/common/components/molecules/DropdownAutocomplete/DropdownAutocomplete";
import DropdownList from "~community/common/components/molecules/DropdownList/DropdownList";
import InputDate from "~community/common/components/molecules/InputDate/InputDate";
import InputField from "~community/common/components/molecules/InputField/InputField";
import InputPhoneNumber from "~community/common/components/molecules/InputPhoneNumber/InputPhoneNumber";
import PeopleLayout from "~community/common/components/templates/PeopleLayout/PeopleLayout";
import { generalDetailsSectionTestId } from "~community/common/constants/testIds";
import { LONG_DATE_TIME_FORMAT } from "~community/common/constants/timeConstants";
import { useTranslator } from "~community/common/hooks/useTranslator";
import { isValidAlphaNumericName } from "~community/common/regex/regexPatterns";
import { DropdownListType } from "~community/common/types/CommonTypes";
import { IconName } from "~community/common/types/IconTypes";
import { convertDateToFormat } from "~community/common/utils/dateTimeUtils";
import { isValidNamePattern } from "~community/common/utils/validation";
import {
  NAME_MAX_CHARACTER_LENGTH,
  PASSPORT_AND_NIN_MAX_CHARACTER_LENGTH
} from "~community/people/constants/configs";
import { usePeopleStore } from "~community/people/store/store";
import { ModifiedFileType } from "~community/people/types/AddNewResourceTypes";
import {
  GenderList,
  MaritalStatusList,
  NationalityList
} from "~community/people/utils/data/employeeSetupStaticData";
import { employeeGeneralDetailsValidation } from "~community/people/utils/peopleValidations";

interface Props {
  isManager?: boolean;
  isAdmin?: boolean;
  isInputsDisabled?: boolean;
}

interface FormMethods {
  validateForm: () => Promise<Record<string, string>>;
  submitForm: () => void;
  resetForm: () => void;
}

const GeneralDetailsSection = forwardRef<FormMethods, Props>(
  (
    { isManager = false, isAdmin = false, isInputsDisabled = false }: Props,
    ref
  ) => {
    const theme: Theme = useTheme();
    const translateText = useTranslator(
      "peopleModule",
      "addResource",
      "generalDetails"
    );

    const {
      employeeContactDetails,
      employeeDataChanges,
      employeeGeneralDetails,
      setEmployeeGeneralDetails
    } = usePeopleStore((state) => state);

    const [age, setAge] = useState<number | string>(0);
    const [selectedDob, setSelectedDob] = useState<DateTime | undefined>(
      undefined
    );
    const initialValues = useMemo(
      () => ({
        authPic: employeeGeneralDetails?.authPic ?? "",
        firstName: employeeGeneralDetails?.firstName || "",
        middleName: employeeGeneralDetails?.middleName || "",
        lastName: employeeGeneralDetails?.lastName || "",
        gender: employeeGeneralDetails?.gender || "",
        birthDate: employeeGeneralDetails?.birthDate || null,
        nationality: employeeGeneralDetails?.nationality || "",
        nin: employeeGeneralDetails?.nin || "",
        passportNumber: employeeGeneralDetails?.passportNumber || "",
        maritalStatus: employeeGeneralDetails?.maritalStatus || ""
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [employeeDataChanges]
    );

    useImperativeHandle(ref, () => ({
      validateForm: async () => {
        const validationErrors = await formik.validateForm();
        return validationErrors;
      },
      submitForm: async () => {
        await formik.submitForm();
      },
      resetForm: () => {
        formik.resetForm();
      }
    }));

    const formik = useFormik({
      initialValues,
      validationSchema: employeeGeneralDetailsValidation(translateText),
      onSubmit: () => {},
      validateOnChange: false,
      validateOnBlur: true,
      enableReinitialize: true
    });

    const { values, errors, setFieldValue, setFieldError } = formik;

    const handleInput = async (e: SelectChangeEvent) => {
      const { name, value } = e.target;
      if (
        (name === "firstName" ||
          name === "middleName" ||
          name === "lastName") &&
        isValidNamePattern(value)
      ) {
        await setFieldValue(name, value);
        setFieldError(name, "");
        setEmployeeGeneralDetails(name, value);
      } else if (
        (name === "passportNumber" || name === "nin") &&
        (value === "" || isValidAlphaNumericName().test(value))
      ) {
        await setFieldValue(name, value);
        setFieldError(name, "");
        setEmployeeGeneralDetails(name, value);
      }
    };

    const handleChange = async (e: SelectChangeEvent) => {
      await setFieldValue(e.target.name, e.target.value);
      setFieldError(e.target.name, "");
      setEmployeeGeneralDetails(e.target.name, e.target.value);
    };

    const dateOnChange = async (
      fieldName: string,
      newValue: string
    ): Promise<void> => {
      if (fieldName && newValue) {
        const dateValue = newValue?.split("T")?.[0] ?? "";
        if (dateValue !== undefined) {
          await setFieldValue(fieldName, dateValue);
          setEmployeeGeneralDetails(fieldName, dateValue);
        }

        setFieldError(fieldName, "");
      }
    };

    const handleNationaltySelect = async (
      e: SyntheticEvent,
      value: DropdownListType
    ): Promise<void> => {
      setFieldError("nationality", "");
      await setFieldValue("nationality", value.value);
      setEmployeeGeneralDetails("nationality", value.value);
    };

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        const profilePic = acceptedFiles.map((file: File) =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        );
        setEmployeeGeneralDetails("authPic", profilePic);
      },
      [setEmployeeGeneralDetails]
    );

    const { open, getInputProps } = useDropzone({
      onDrop,
      noClick: true,
      noKeyboard: true,
      accept: {
        "image/svg+xml": [],
        "image/png": [],
        "image/jpg": [],
        "image/jpeg": []
      }
    });

    const handleUnSelectPhoto = (): void => {
      setEmployeeGeneralDetails("authPic", []);
    };

    useEffect(() => {
      if (!values.birthDate) {
        setAge("-");
        return;
      }

      const birthDate = new Date(values.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      setAge(age);
    }, [values.birthDate]);

    useEffect(() => {
      if (values.birthDate) {
        const birthDateTime = DateTime.fromISO(values.birthDate);
        setSelectedDob(birthDateTime);
      } else {
        setSelectedDob(undefined);
      }
    }, [values.birthDate]);

    return (
      <PeopleLayout
        title={translateText(["title"])}
        containerStyles={{
          padding: "0",
          margin: "0 auto",
          height: "auto",
          fontFamily: "Poppins, sans-serif"
        }}
        dividerStyles={{
          mt: "0.5rem"
        }}
        pageHead={translateText(["head"])}
      >
        <form onSubmit={formik.handleSubmit}>
          <>
            <Stack
              direction="column"
              sx={{ display: isManager || isAdmin ? "none" : "block" }}
            >
              <Stack
                direction="row"
                alignItems="center"
                sx={{ mb: "1.5rem", position: "relative" }}
              >
                <Avatar
                  id="avatar"
                  alt={values.firstName}
                  src={
                    employeeGeneralDetails?.authPic?.length
                      ? (employeeGeneralDetails?.authPic[0] as ModifiedFileType)
                          ?.preview
                      : ""
                  }
                  sx={{
                    width: "6.125rem",
                    height: "6.125rem",
                    backgroundColor: theme.palette.grey[200]
                  }}
                >
                  <Icon name={IconName.USER_UPLOAD_ICON} />
                </Avatar>
                <Box>
                  <input id="imageInput" {...getInputProps()} />
                  <Box
                    sx={{
                      position: "absolute",
                      left: "4.375rem",
                      top: "5rem",
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      backgroundColor: theme.palette.secondary.main,
                      cursor: "pointer",
                      zIndex: 1
                    }}
                    onClick={
                      employeeGeneralDetails?.authPic?.length
                        ? handleUnSelectPhoto
                        : open
                    }
                  >
                    {employeeGeneralDetails?.authPic?.length ? (
                      <RequestCancelCrossIcon
                        fill={theme.palette.primary.dark}
                      />
                    ) : (
                      <PlusIcon fill={theme.palette.primary.dark} />
                    )}
                  </Box>
                </Box>
              </Stack>
            </Stack>

            <Grid
              container
              spacing={2}
              sx={{
                mb: "2rem"
              }}
            >
              <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                <InputField
                  label={translateText(["firstName"])}
                  inputType="text"
                  value={values.firstName}
                  placeHolder={translateText(["enterFirstName"])}
                  onChange={handleInput}
                  inputName="firstName"
                  error={errors.firstName ?? ""}
                  componentStyle={{
                    flex: 1,
                    mt: "0rem"
                  }}
                  required={!isManager}
                  readOnly={isManager}
                  isDisabled={isInputsDisabled}
                  maxLength={NAME_MAX_CHARACTER_LENGTH}
                  data-testid={
                    generalDetailsSectionTestId.InputFields.firstName
                  }
                  validation-testid={
                    generalDetailsSectionTestId.InputFields.firstNameValidation
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                <InputField
                  label={translateText(["middleName"])}
                  inputType="text"
                  value={values.middleName}
                  placeHolder={
                    !isManager ? translateText(["enterMiddleName"]) : ""
                  }
                  onChange={handleInput}
                  inputName="middleName"
                  error={errors.middleName ?? ""}
                  componentStyle={{
                    flex: 1,
                    mt: "0rem"
                  }}
                  readOnly={isManager}
                  isDisabled={isInputsDisabled}
                  maxLength={NAME_MAX_CHARACTER_LENGTH}
                  data-testid={
                    generalDetailsSectionTestId.InputFields.middleName
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                <InputField
                  label={translateText(["lastName"])}
                  inputType="text"
                  value={values.lastName}
                  placeHolder={translateText(["enterLastName"])}
                  onChange={handleInput}
                  inputName="lastName"
                  error={errors.lastName ?? ""}
                  componentStyle={{
                    flex: 1,
                    mt: "0rem"
                  }}
                  required={!isManager}
                  readOnly={isManager}
                  isDisabled={isInputsDisabled}
                  maxLength={NAME_MAX_CHARACTER_LENGTH}
                  data-testid={generalDetailsSectionTestId.InputFields.lastName}
                  validation-testid={
                    generalDetailsSectionTestId.InputFields.lastNameValidation
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                <DropdownList
                  inputName="gender"
                  label={translateText(["gender"])}
                  value={values.gender}
                  placeholder={translateText(["selectGender"])}
                  onChange={handleChange}
                  error={errors.gender ?? ""}
                  componentStyle={{
                    mt: "0rem"
                  }}
                  errorFocusOutlineNeeded={false}
                  itemList={GenderList}
                  checkSelected
                  readOnly={isManager}
                  isDisabled={isInputsDisabled}
                />
              </Grid>

              <Grid
                size={{ xs: 12, md: 6, xl: 4 }}
                sx={{ display: isManager ? "none" : "block" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem"
                  }}
                >
                  <InputDate
                    label={translateText(["birthDate"])}
                    value={DateTime.fromISO(values?.birthDate || "")}
                    onchange={(newValue: string | null) => {
                      if (newValue) {
                        dateOnChange(
                          "birthDate",
                          (convertDateToFormat(
                            new Date(newValue as string),
                            LONG_DATE_TIME_FORMAT
                          ) as string) ?? ""
                        );
                      }
                    }}
                    placeholder={translateText(["selectBirthDate"])}
                    error={errors?.birthDate ?? ""}
                    maxDate={DateTime.fromISO(
                      new Date()?.toISOString()?.split("T")[0]
                    )}
                    componentStyle={{
                      flex: 1,
                      mt: "0rem"
                    }}
                    inputFormat="dd/MM/yyyy"
                    disabled={isInputsDisabled}
                    selectedDate={selectedDob}
                    setSelectedDate={setSelectedDob}
                  />
                  <InputField
                    label={translateText(["age"])}
                    inputType="text"
                    value={age}
                    isDisabled={true}
                    inputName="age"
                    componentStyle={{
                      flex: 0.25,
                      mt: "0rem"
                    }}
                    labelStyles={{
                      color: theme.palette.grey.A100
                    }}
                  />
                </div>
              </Grid>

              <Grid
                size={{ xs: 12, md: 6, xl: 4 }}
                sx={{ display: isManager ? "none" : "block" }}
              >
                <DropdownAutocomplete
                  itemList={NationalityList}
                  inputName="nationalty"
                  label={translateText(["nationality"])}
                  value={
                    values.nationality
                      ? {
                          label: values.nationality,
                          value: values.nationality
                        }
                      : { label: "", value: "" }
                  }
                  placeholder={translateText(["selectNationality"])}
                  onChange={handleNationaltySelect}
                  error={errors.nationality ?? ""}
                  componentStyle={{
                    mt: "0rem"
                  }}
                  isDisabled={isInputsDisabled}
                />
              </Grid>

              <Grid
                size={{ xs: 12, md: 6, xl: 4 }}
                sx={{ display: isManager ? "none" : "block" }}
              >
                <InputField
                  label={translateText(["nin"])}
                  inputType="text"
                  value={values.nin}
                  placeHolder={translateText(["enterNIN"])}
                  onChange={handleInput}
                  inputName="nin"
                  error={errors.nin ?? ""}
                  componentStyle={{
                    flex: 1
                  }}
                  isDisabled={isInputsDisabled}
                  maxLength={PASSPORT_AND_NIN_MAX_CHARACTER_LENGTH}
                />
              </Grid>

              <Grid
                size={{ xs: 12, md: 6, xl: 4 }}
                sx={{ display: isManager ? "none" : "block" }}
              >
                <InputField
                  label={translateText(["passportNo"])}
                  inputType="text"
                  value={values.passportNumber}
                  placeHolder={translateText(["enterPassportNo"])}
                  onChange={handleInput}
                  inputName="passportNumber"
                  error={errors.passportNumber ?? ""}
                  componentStyle={{
                    flex: 1
                  }}
                  isDisabled={isInputsDisabled}
                  maxLength={PASSPORT_AND_NIN_MAX_CHARACTER_LENGTH}
                />
              </Grid>
              <Grid
                size={{ xs: 12, md: 6, xl: 4 }}
                sx={{ display: isManager ? "none" : "block" }}
              >
                <DropdownList
                  inputName="maritalStatus"
                  label={translateText(["maritalStatus"])}
                  value={values.maritalStatus}
                  placeholder={translateText(["selectMaritalStatus"])}
                  onChange={handleChange}
                  error={errors.maritalStatus ?? ""}
                  componentStyle={{
                    mt: "0rem"
                  }}
                  errorFocusOutlineNeeded={false}
                  itemList={MaritalStatusList}
                  checkSelected
                  isDisabled={isInputsDisabled}
                />
              </Grid>
              <Grid
                size={{ xs: 12, md: 6, xl: 4 }}
                sx={{ display: isManager ? "block" : "none" }}
              >
                <InputPhoneNumber
                  label={translateText(["contactNo"])}
                  value={employeeContactDetails?.phone ?? ""}
                  countryCodeValue={employeeContactDetails?.countryCode}
                  inputName="phone"
                  fullComponentStyle={{
                    mt: "0rem"
                  }}
                  readOnly={isManager}
                  isDisabled={isManager || isInputsDisabled}
                />
              </Grid>
            </Grid>
          </>
        </form>
      </PeopleLayout>
    );
  }
);

GeneralDetailsSection.displayName = "GeneralDetailsSection";

export default GeneralDetailsSection;
