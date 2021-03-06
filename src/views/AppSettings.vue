<template>
  <div class="page-content">
    <div class="padding-container">
      <h4 class="title is-4">{{ $i18n('appSettings.header') }}</h4>
    </div>
    <form
      ref="form"
      @submit.prevent="submit">
      <b-tabs v-if="loadedSettings">
        <b-tab-item :label="$i18n('appSettings.tabs.general')">
          <config-field :label="$i18n('appSettings.fields.general.routerUrl.label')">
            <b-field
              :type="validation.routerUrl.type"
              :message="validation.routerUrl.message">
              <b-input
                v-model="settings.general.routerUrl"
                :loading="pinging"
                type="url"
                @blur="onBlurRouterUrl"/>
            </b-field>
          </config-field>
          <config-field :label="$i18n('appSettings.fields.general.loginDetails.label')">
            <b-field :label="$i18n('appSettings.fields.general.username.label')">
              <b-input
                v-model="settings.general.username"
                type="text"/>
            </b-field>
            <b-field :label="$i18n('appSettings.fields.general.password.label')">
              <b-input
                v-model="settings.general.password"
                type="password"
                password-reveal/>
            </b-field>
          </config-field>
          <config-field
            :label="$i18n('appSettings.fields.general.defaultMode.label')"
            :description="$i18n('appSettings.fields.general.defaultMode.description')">
            <template v-for="mode in modes">
              <b-radio
                :key="mode"
                v-model="settings.general.defaultMode"
                :native-value="mode">
                {{ $i18n('modes.'+modeNames[mode]) }}
              </b-radio>
            </template>
          </config-field>
          <config-field
            :label="$i18n('appSettings.fields.general.rememberLogin.label')"
            :description="$i18n('appSettings.fields.general.rememberLogin.description')">
            <b-checkbox v-model="settings.general.rememberLoginDetails"/>
          </config-field>
        </b-tab-item>
        <b-tab-item :label="$i18n('appSettings.tabs.sms')">
          <config-field
            :label="$i18n('appSettings.fields.sms.hideSimBoxes.label')"
            :description="$i18n('appSettings.fields.sms.hideSimBoxes.description')">
            <b-checkbox v-model="settings.sms.hideSimBoxes"/>
          </config-field>
          <config-field
            :label="$i18n('appSettings.fields.sms.confirmDialogsToShow.label')"
            :description="$i18n('appSettings.fields.sms.confirmDialogsToShow.description')">
            <b-checkbox
              v-model="settings.sms.confirmDialogsToShow"
              native-value="delete">
              {{ $i18n('sms.actions.delete.name') }}
            </b-checkbox>
            <b-checkbox
              v-model="settings.sms.confirmDialogsToShow"
              native-value="import">
              {{ $i18n('sms.actions.import.name') }}
            </b-checkbox>
          </config-field>
          <config-field
            :label="$i18n('appSettings.fields.sms.typeIcons.label')"
            :description="$i18n('appSettings.fields.sms.typeIcons.description')">
            <b-field
              v-for="smsType in smsTypes"
              :key="smsType"
              :label="getSmsTypeName(smsType)"
              horizontal>
              <icon-picker v-model="settings.sms.typeIcons[smsType]"/>
            </b-field>
          </config-field>
        </b-tab-item>
      </b-tabs>
      <div class="buttons is-centered">
        <button
          :class="{'is-loading': saving || formLoading}"
          class="button is-primary"
          type="submit">
          {{ $i18n('appSettings.saveButton') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { modes, modeNames } from '@/store';
import smsTypeMixin from '@/mixins/smsType';
import router from 'huawei-router-api/browser';
import IconPicker from '@/components/iconpicker';
import ConfigField from '@/components/settings/ConfigField.vue';

const smsTypes = router.sms.types;

// TODO: Add a button to reset settings to their defaults
export default {
  components: {
    IconPicker,
    ConfigField,
  },
  mixins: [smsTypeMixin],
  data() {
    return {
      loadedSettings: false,
      saving: false,
      settings: {},
      validation: {
        routerUrl: {
          type: '',
          message: '',
        },
      },
      pinging: false,
      formLoading: false,
    };
  },
  computed: {
    modes: () => modes,
    modeNames: () => modeNames,
    smsTypes: () => smsTypes,
  },
  watch: {
    'settings.general.routerUrl': function routerUrlSetting() {
      this.validation.routerUrl.type = '';
      this.validation.routerUrl.message = '';
    },
  },
  async beforeMount() {
    await this.$store.dispatch('settings/load');
    const stateSettings = this.$store.state.settings.internal;
    for (const domain of Object.keys(stateSettings)) {
      this.$set(this.settings, domain, {});
      for (const name of Object.keys(stateSettings[domain])) {
        this.$set(this.settings[domain], name, stateSettings[domain][name]);
      }
    }
    this.loadedSettings = true;
  },
  methods: {
    async setSetting(path, value) {
      await this.$store.dispatch('settings/set', { path: `internal.${path}`, value });
    },
    showMessage(message, type) {
      this.$toast.open({ message, type });
    },
    async submit() {
      if (this.$refs.form.checkValidity()) {
        this.saving = true;
        const promises = [];
        for (const domain of Object.keys(this.settings)) {
          for (const name of Object.keys(this.settings[domain])) {
            promises.push(this.setSetting(`${domain}.${name}`, this.settings[domain][name]));
          }
        }
        try {
          await Promise.all(promises);
          await this.$store.dispatch('settings/save');
          this.showMessage(this.$i18n('appSettings.saveSuccess'), 'is-success');
          this.globalBus.$emit('options-saved');
          this.$emit('save');
        } catch (e) {
          this.showMessage(this.$i18n('appSettings.saveError'), 'is-danger');
          this.$store.dispatch('handleError', e);
        } finally {
          this.saving = false;
        }
      }
    },
    async testRouterUrl() {
      this.validation.routerUrl.type = '';
      this.validation.routerUrl.message = '';
      this.pinging = true;
      try {
        await router.utils.ping(this.settings.general.routerUrl);
        this.validation.routerUrl.type = 'is-success';
        this.validation.routerUrl.message = '';
      } catch (e) {
        this.validation.routerUrl.type = 'is-danger';
        this.validation.routerUrl.message = this.$i18n('appSettings.pingError');
      } finally {
        this.pinging = false;
      }
    },
    async onBlurRouterUrl() {
      this.formLoading = true;
      try {
        await this.testRouterUrl();
      } finally {
        this.formLoading = false;
      }
    },
  },
};
</script>
