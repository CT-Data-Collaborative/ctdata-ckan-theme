def dict_with_key_value(key, value, lst):
    for dictionary in lst:
        if dictionary[key].lower() == value.lower():
            return dictionary
    return None


class Singleton(type):
    def __init__(cls, name, bases, dict):
        super(Singleton, cls).__init__(name, bases, dict)
        cls.instance = None

    def __call__(cls, *args, **kw):
        if cls.instance is None:
            cls.instance = super(Singleton, cls).__call__(*args, **kw)
        return cls.instance