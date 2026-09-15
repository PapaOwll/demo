// TODO: rethink about this file

// setting modules
import GeneralSettings from '@/modules/Settings/GeneralSettings/modules'
import PriceSettings from '@/modules/Settings/PriceSettings/module'
import ClinicSetting from '@/modules/Settings/ClinicSetting/module'
import OperatorSetting from '@/modules/Settings/OperatorSetting/module'
import PersonalSetting from '@/modules/Settings/PersonalSetting/module'
import Calendar from '@/modules/Settings/Calendar/module'
import RoleSetting from '@/modules/Settings/RoleSetting/module'

// surveys
import SurveyList from '@/modules/Survey/SurveyList/module'
import ResultsList from '@/modules/Survey/ResultsList/module'

export default {
  Setting: {
    GeneralSettings,
    PriceSettings,
    ClinicSetting,
    OperatorSetting,
    PersonalSetting,
    Calendar,
    RoleSetting,
  },
  Survey: {
    SurveyList,
    ResultsList,
  },
}
